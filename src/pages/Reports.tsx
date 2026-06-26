// Reports.tsx — visualize INV (count) vs ORD (ordered) over time as horizontal
// stacked bars (Y = tracking date, X = quantity, segments = items).
// PRESENTATIONAL ONLY: it shapes the chart from the data you pass.
//
// THE SEAM: the container passes the current restaurant's active catalog
// (categories + items) and trackings (with lines) from Redux/Firestore, plus
// onOpenTracking. All filtering/aggregation here is view-model computation.
import { useMemo, useState, type ReactNode } from 'react';
import { Icon } from '../ui/Icon';
import { Button, Empty } from '../ui/primitives';
import { formatQty } from '../lib/quantity';
import { hasQty, type UnitQty } from '../lib/units';

export interface ReportItem { id: string; name: string; }
export interface ReportCategory { id: string; label: string; items: ReportItem[]; }
export interface ReportLine { inv?: UnitQty | null; ord?: UnitQty | null; }
export interface ReportTracking { id: string; dateMs: number; lines: Record<string, ReportLine>; }

// Extract numeric value from a UnitQty for chart aggregation (units are mutually exclusive so there is only one value).
const qtyVal = (q: UnitQty | null | undefined): number =>
  q ? (Object.values(q)[0] ?? 0) : 0;

const fmtNum = (n: number) => formatQty(n);

type Metric = 'inv' | 'ord';
const METRIC: Record<Metric, { label: string; accent: string }> = {
  inv: { label: 'Count', accent: 'var(--accent-text)' },
  ord: { label: 'Ordered', accent: 'var(--low-text)' },
};

function itemColor(i: number, n: number) {
  const hue = 150 + (i / Math.max(1, n)) * 290;
  const light = i % 2 ? 0.72 : 0.62;
  return `oklch(${light} 0.115 ${hue.toFixed(1)})`;
}
function niceMax(v: number) {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return m * pow;
}
const RANGES = [
  { id: 'all', label: 'All', days: Infinity },
  { id: '14', label: '14d', days: 14 },
  { id: '30', label: '30d', days: 30 },
  { id: '45', label: '45d', days: 45 },
];

export function Reports({
  header, categories, trackings, onOpenTracking,
}: {
  header?: ReactNode;
  categories: ReportCategory[];
  trackings: ReportTracking[];
  onOpenTracking: (id: string) => void;
}) {
  const catGroups = useMemo(() => categories.filter((c) => c.items.length), [categories]);
  const defaultCat = useMemo(() => {
    if (!catGroups.length) return null;
    return [...catGroups].sort((a, b) => Math.abs(a.items.length - 9) - Math.abs(b.items.length - 9))[0].id;
  }, [catGroups]);

  const [metric, setMetric] = useState<Metric>('inv');
  const [catId, setCatId] = useState<string | null>(defaultCat);
  const [range, setRange] = useState('all');
  const [orderedOnly, setOrderedOnly] = useState(false);
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set());
  const [active, setActive] = useState<string | null>(null);

  let currentCatId = catId;
  if (!catGroups.some((c) => c.id === catId)) {
    currentCatId = defaultCat;
    setCatId(defaultCat);
  }

  const [prevCatId, setPrevCatId] = useState<string | null>(defaultCat);
  if (currentCatId !== prevCatId) {
    setExcluded(new Set());
    setActive(null);
    setPrevCatId(currentCatId);
  }

  const m = METRIC[metric];
  const group = catGroups.find((c) => c.id === currentCatId);

  const [now] = useState(() => Date.now());
  const rangeDays = RANGES.find((r) => r.id === range)!.days;
  const cutoff = now - rangeDays * 86400000;
  const sessions = useMemo(() => trackings.filter((t) => t.dateMs >= cutoff).sort((a, b) => b.dateMs - a.dateMs), [trackings, cutoff]);

  const pool = useMemo(() => {
    if (!group) return [];
    if (!orderedOnly) return group.items;
    return group.items.filter((it) => sessions.some((t) => hasQty(t.lines?.[it.id]?.ord)));
  }, [group, orderedOnly, sessions]);

  const itemMeta = useMemo(() => {
    const meta: Record<string, { color: string; total: number; hits: number; name: string }> = {};
    pool.forEach((it, i) => {
      let total = 0, hits = 0;
      sessions.forEach((t) => {
        const v = t.lines?.[it.id]?.[metric];
        if (hasQty(v)) { total += qtyVal(v); hits++; }
      });
      meta[it.id] = { color: itemColor(i, pool.length), total, hits, name: it.name };
    });
    return meta;
  }, [pool, sessions, metric]);

  const included = pool.filter((it) => !excluded.has(it.id));

  const rows = useMemo(() => sessions.map((t) => {
    let total = 0;
    const segs: { id: string; value: number }[] = [];
    included.forEach((it) => {
      const v = t.lines?.[it.id]?.[metric];
      if (hasQty(v)) { const n = qtyVal(v); if (n > 0) { segs.push({ id: it.id, value: n }); total += n; } }
    });
    return { t, segs, total };
  }), [sessions, included, metric]);

  const peak = Math.max(1, ...rows.map((r) => r.total));
  const axisMax = niceMax(peak);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ pct: f * 100, val: fmtNum(axisMax * f) }));
  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const activeMeta = active ? itemMeta[active] : null;
  const allOn = excluded.size === 0;

  const toggleInclude = (id: string) =>
    setExcluded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });
  const setAll = (on: boolean) => setExcluded(on ? new Set() : new Set(pool.map((i) => i.id)));

  return (
    <div className="it-app screen">
      {header ?? <div className="appbar"><div className="appbar__title">Reports</div></div>}
      <div className="scroll">
        <div className="pad stack" style={{ gap: 14 }}>
          <div className="seg">
            <button className={`seg__opt ${metric === 'inv' ? 'seg__opt--active is-delivery' : ''}`} onClick={() => setMetric('inv')}><Icon name="count" size={17} /> Count</button>
            <button className={`seg__opt ${metric === 'ord' ? 'seg__opt--active' : ''}`} onClick={() => setMetric('ord')}><Icon name="truck" size={17} /> Ordered</button>
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 7 }}>Category</div>
            <div className="chips">
              {catGroups.map((c) => (
                <button key={c.id} className={`chip ${currentCatId === c.id ? 'chip--active' : ''}`} onClick={() => setCatId(c.id)}>
                  {c.label}<span className="chip__count">{c.items.length}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div className="chips" style={{ flex: 1, minWidth: 0 }}>
              {RANGES.map((r) => <button key={r.id} className={`chip ${range === r.id ? 'chip--active' : ''}`} onClick={() => setRange(r.id)}>{r.label}</button>)}
            </div>
            <button className="chip" onClick={() => setOrderedOnly((o) => !o)}
              style={orderedOnly ? { background: 'var(--low-bg)', borderColor: 'var(--low-line)', color: 'var(--low-text)' } : undefined}>
              <Icon name={orderedOnly ? 'checkCircle' : 'truck'} size={14} /> Ordered only
            </button>
          </div>

          <div className="card card--pad" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <div className="mono fw-7" style={{ fontSize: 28, lineHeight: 1, color: m.accent }}>{fmtNum(grandTotal)}</div>
              <div className="eyebrow" style={{ marginTop: 5 }}>Total {m.label.toLowerCase()}</div>
            </div>
            <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border)' }} />
            <div style={{ display: 'flex', gap: 18 }}>
              <div><div className="mono fw-7" style={{ fontSize: 18 }}>{included.length}<span className="muted-2" style={{ fontSize: 12, fontWeight: 500 }}>/{pool.length}</span></div><div className="muted-2" style={{ fontSize: 11.5, marginTop: 3 }}>items</div></div>
              <div><div className="mono fw-7" style={{ fontSize: 18 }}>{sessions.length}</div><div className="muted-2" style={{ fontSize: 11.5, marginTop: 3 }}>counts</div></div>
            </div>
          </div>

          <div className="card card--flush">
            <div className="card-head">
              <h3>{group ? group.label : 'Chart'} · {m.label}</h3>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>per {metric}</span>
            </div>

            {activeMeta && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px', background: 'var(--surface-2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                <span style={{ width: 11, height: 11, borderRadius: 3, background: activeMeta.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="fw-6" style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeMeta.name}</div>
                  <div className="mono muted-2" style={{ fontSize: 11, marginTop: 1 }}>Σ {fmtNum(activeMeta.total)} · {activeMeta.hits} of {sessions.length} counts</div>
                </div>
                <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => setActive(null)} aria-label="clear"><Icon name="x" size={15} /></button>
              </div>
            )}

            {rows.length === 0 || grandTotal === 0 ? (
              <Empty icon="reports" title="Nothing to chart"
                body={orderedOnly ? 'No orders recorded for this category in range.' : 'No recorded values for this selection.'}
                action={orderedOnly ? <Button variant="secondary" onClick={() => setOrderedOnly(false)}>Show all items</Button> : undefined} />
            ) : (
              <div style={{ padding: '12px 14px 14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '54px 1fr 46px', gap: 10, marginBottom: 5 }}>
                  <span />
                  <div style={{ position: 'relative', height: 12 }}>
                    {ticks.map((tk, i) => (
                      <span key={i} className="mono" style={{ position: 'absolute', left: `${tk.pct}%`, transform: i === 0 ? 'none' : i === ticks.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)', fontSize: 9.5, color: 'var(--ink-4)' }}>{tk.val}</span>
                    ))}
                  </div>
                  <span />
                </div>

                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: 64, right: 56, pointerEvents: 'none' }}>
                    {ticks.map((tk, i) => <span key={i} style={{ position: 'absolute', left: `${tk.pct}%`, top: 0, bottom: 0, width: 1, background: i === 0 ? 'var(--border-2)' : 'var(--border)' }} />)}
                  </div>

                  {rows.map(({ t, segs, total }) => {
                    const d = new Date(t.dateMs);
                    return (
                      <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '54px 1fr 46px', gap: 10, alignItems: 'center', padding: '4px 0' }}>
                        <button onClick={() => onOpenTracking(t.id)} style={{ textAlign: 'left', lineHeight: 1.05 }}>
                          <div className="mono fw-7" style={{ fontSize: 13 }}>{d.getDate()}</div>
                          <div className="mono muted-2" style={{ fontSize: 9, textTransform: 'uppercase' }}>{d.toLocaleDateString('en-US', { month: 'short' })}</div>
                        </button>
                        <div style={{ position: 'relative', height: 24, borderRadius: 5, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', overflow: 'hidden' }}>
                          {segs.length === 0 && <span className="mono" style={{ alignSelf: 'center', marginLeft: 8, fontSize: 10, color: 'var(--ink-4)' }}>—</span>}
                          {segs.map((s, i) => {
                            const meta = itemMeta[s.id];
                            const dim = active && active !== s.id;
                            return (
                              <button key={s.id} onClick={() => setActive((a) => (a === s.id ? null : s.id))} title={`${meta.name} · ${fmtNum(s.value)}`}
                                style={{ width: `${(s.value / axisMax) * 100}%`, background: meta.color, opacity: dim ? 0.22 : 1, borderRight: i < segs.length - 1 ? '1px solid rgba(255,255,255,0.65)' : 'none', boxShadow: active === s.id ? 'inset 0 0 0 1.5px rgba(26,26,24,0.55)' : 'none', transition: 'width .4s ease, opacity .15s', minWidth: 2 }} />
                            );
                          })}
                        </div>
                        <div className="mono fw-6" style={{ fontSize: 12.5, textAlign: 'right', color: total > 0 ? 'var(--ink)' : 'var(--ink-4)' }}>{fmtNum(total)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {pool.length > 0 && (
            <div className="card card--flush">
              <div className="card-head">
                <h3>Items <span style={{ color: 'var(--ink-4)', fontWeight: 600 }}>· tap to inspect</span></h3>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn--ghost btn--sm" onClick={() => setAll(true)} disabled={allOn} style={{ height: 28, padding: '0 9px', fontSize: 12.5 }}>All</button>
                  <button className="btn btn--ghost btn--sm" onClick={() => setAll(false)} disabled={excluded.size === pool.length} style={{ height: 28, padding: '0 9px', fontSize: 12.5 }}>None</button>
                </div>
              </div>
              <div style={{ maxHeight: 232, overflowY: 'auto' }}>
                {pool.map((it) => {
                  const meta = itemMeta[it.id];
                  const off = excluded.has(it.id);
                  const isActive = active === it.id;
                  return (
                    <div key={it.id} className="trk-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: isActive ? 'var(--surface-2)' : 'var(--surface)' }}>
                      <button onClick={() => toggleInclude(it.id)} aria-label={off ? 'show item' : 'hide item'}
                        style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, background: off ? 'var(--surface-2)' : meta.color, border: off ? '1.5px dashed var(--border-3)' : '1px solid rgba(0,0,0,0.08)' }} />
                      <button onClick={() => setActive((a) => (a === it.id ? null : it.id))} style={{ flex: 1, minWidth: 0, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="fw-6" style={{ fontSize: 13.5, color: off ? 'var(--ink-4)' : 'var(--ink)', textDecoration: off ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</span>
                      </button>
                      <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: off ? 'var(--ink-4)' : 'var(--ink-2)', flexShrink: 0 }}>{fmtNum(meta.total)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="content-pad-bottom" />
        </div>
      </div>
    </div>
  );
}
