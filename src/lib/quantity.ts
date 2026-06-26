// Fractional quantities: the DB stores rounded decimals (0.75), the UI shows
// mixed-number fractions (¾, 2½). This module is the single source of truth for
// both directions — it replaces the per-page fmtNum helpers.

// Recognized fractional parts, matched on display. Stored thirds (0.33 / 0.67)
// resolve back to ⅓ / ⅔ via the tolerance in formatQty.
export const FRACTIONS: { value: number; glyph: string }[] = [
  { value: 0.25, glyph: '¼' },
  { value: 1 / 3, glyph: '⅓' },
  { value: 0.5, glyph: '½' },
  { value: 2 / 3, glyph: '⅔' },
  { value: 0.75, glyph: '¾' },
];

const TOL = 0.02;

// Round to 2 decimals — the value shape persisted to Firestore (0.7533 → 0.75).
export const roundQty = (n: number): number => Math.round(n * 100) / 100;

// Glyph for a fractional part in [0,1), or null if it isn't a recognized fraction.
export const fractionGlyph = (frac: number): string | null => {
  for (const f of FRACTIONS) if (Math.abs(frac - f.value) < TOL) return f.glyph;
  return null;
};

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

// Best "n/d" for a fractional part in (0,1) using kitchen-sensible denominators,
// so the UI shows a fraction (e.g. ⅛ → "1/8") rather than a decimal.
const vulgarFraction = (frac: number): string | null => {
  let best: [number, number] | null = null;
  let bestErr = Infinity;
  for (const d of [2, 3, 4, 5, 6, 8, 12, 16]) {
    const n = Math.round(frac * d);
    if (n <= 0 || n >= d) continue;
    const err = Math.abs(frac - n / d);
    if (err < bestErr) { bestErr = err; best = [n, d]; }
  }
  if (!best) return null;
  const g = gcd(best[0], best[1]);
  return `${best[0] / g}/${best[1] / g}`;
};

// Decimal → mixed-number string. 0.5→"½", 2.5→"2½", 3→"3", 0.625→"5/8", 2.125→"2 1/8".
export const formatQty = (n: number): string => {
  if (!Number.isFinite(n)) return '–';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  let whole = Math.floor(abs);
  let frac = abs - whole;
  if (frac > 1 - TOL) { whole += 1; frac = 0; } // round a near-whole part up
  if (frac < TOL) return sign + String(whole);
  const glyph = fractionGlyph(frac);
  if (glyph) return sign + (whole > 0 ? whole + glyph : glyph);
  const vf = vulgarFraction(frac);
  if (vf) return sign + (whole > 0 ? `${whole} ${vf}` : vf);
  return sign + String(roundQty(abs));
};

// Custom fraction num/den → decimal, or null when the denominator is invalid.
export const parseFraction = (num: number, den: number): number | null => {
  if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
  return roundQty(num / den);
};
