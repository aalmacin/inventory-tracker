# Fractional Quantities — Design

## Goal
Let users enter inventory/order quantities with fractions (½, ¼, ¾, custom). Store rounded
decimals in the database; render mixed-number fractions in the UI. No decimals are ever shown
in the UI — decimal is a backend/storage detail only.

## Conversion module — `src/lib/quantity.ts`
Single source of truth; replaces the three duplicated `fmtNum` helpers.

- `formatQty(n: number): string` — decimal → mixed-number string. **No decimals ever appear.**
  - Whole + fractional split. Fractional part matched to a glyph within **0.02 tolerance**:
    `¼ ⅓ ½ ⅔ ¾` (0.25, 0.33, 0.5, 0.67, 0.75). A near-whole part (>1−tol) rounds up.
  - Any other fractional part falls back to a vulgar fraction `n/d` (denominators 2,3,4,5,6,8,
    12,16, reduced), with a space when there's a whole part.
  - Examples: `0.5→"½"`, `2.5→"2½"`, `0.33→"⅓"`, `3→"3"`, `0.6→"3/5"`, `0.625→"5/8"`,
    `2.125→"2 1/8"`, `0.99→"3"`-style near-whole rounding (`0.99→"1"` for the fraction part).
- `roundQty(n: number): number` — `Math.round(n*100)/100`. The storage rounding (0.7533→0.75).
- `parseFraction(num: number, den: number): number | null` — custom fraction → decimal; null if
  invalid (den 0/NaN).

## Storage rounding — single chokepoint
Apply `roundQty` where lines are written (`features/trackings/firestore.ts`) and where delivery
`arrived` is written, so everything persisted is rounded to 2 dp. Custom `1/3` → `0.33` → renders
back as ⅓. No data migration — existing decimals already render correctly.

## Display — swap `fmtNum` → `formatQty`
- `pages/Tracking.tsx`: cell values + recent-value chips (currently raw).
- `pages/TrackingDetail.tsx`: inv/ord cells, delivery "got"/"of", print sheet.
- `pages/Reports.tsx`: per-session values, totals, axis ticks (graceful mixed-number degradation).

## CellEditor — two-field entry (`pages/Tracking.tsx`)
Applies to both `inv` and `ord`.

- **Whole-number field** (wide) with `− / +` stepper, integers only. ±1 changes the whole part.
- **Fraction field** (smaller, display) showing the current glyph, set by chips.
- **Chips**: `None · ½ · ¼ · ¾ · Custom`. None = whole number only. Matching chip highlights.
- **Custom** reveals `[num] / [den]` inline entry → `parseFraction` sets the fractional part.
- **"Total: 2½"** preview line reconciles the two fields into the rendered value.
- Recent-used chips render via `formatQty`.
- Editor value = `whole + fraction`, persisted through `roundQty`.

## Out of scope
- No test framework (project has none; not added unprompted).
- No change to data model/types (`inv`/`ord` stay `number | null`).
