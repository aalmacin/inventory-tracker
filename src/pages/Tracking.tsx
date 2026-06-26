// Tracking.tsx — the walk: record INV + ORD per item as a per-unit breakdown
// (e.g. 3 boxes, 2 packs, 11 pieces), with recent-breakdown chips.
// PRESENTATIONAL ONLY.
//
// THE SEAM: the container passes the active catalog grouped by category, the
// existing lines (for edit), and recentInv/recentOrd lookups derived from this
// restaurant's past trackings (Redux/Firestore). onSave receives the cleaned
// lines + note + date; you persist them to restaurants/{rid}/trackings.
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/Icon';
import { Button, Empty, FlowHeader } from '../ui/primitives';
import { FRACTIONS, formatQty, parseFraction, roundQty } from '../lib/quantity';
import {
  UNIT_ABBR, UNIT_DISPLAY_ORDER, formatUnitQtyLong, hasQty, qtyEntries, qtyKey,
  type Unit, type UnitQty,
} from '../lib/units';

export type LineValue = { inv?: UnitQty; ord?: UnitQty };
export type Lines = Record<string, LineValue>;

export interface TrackItemVM { id: string; name: string; }
export interface TrackCategoryVM { id: string; label: string; items: TrackItemVM[]; }

// quick-pick fractions shown as chips (covers the common ¼ ½ ¾; custom covers the rest)
const CHIPS = FRACTIONS.filter((f) => f.value === 0.25 || f.value === 0.5 || f.value === 0.75);

// ── compact per-unit cell content: a small vertical stack (3bx / 2pk / 11pc) ──
function CellQty({ qty, empty }: { qty: UnitQty | undefined; empty: string }) {
  if (!hasQty(qty)) return <>{empty}</>;
  return (
    <span className="cellqty">
      {qtyEntries(qty).map(({ unit, value }) => (
        <span key={unit} className="cellqty__line">{formatQty(value)}{' '}<i>{UNIT_ABBR[unit]}</i></span>
      ))}
    </span>
  );
}

// ── inline cell editor ───────────────────────────────────────
// One breakdown is edited a unit at a time: pick a unit (boxes/packs/pieces) and
// set its whole number + fraction (½ ¼ ¾ or custom n/d). Decimals never appear in
// the UI — the value is combined to a decimal only on the way to storage.
function CellEditor({
  item, field, value, recents, onChange, onClose,
}: {
  item: TrackItemVM;
  field: 'inv' | 'ord';
  value: UnitQty | undefined;
  recents: UnitQty[];
  onChange: (q: UnitQty) => void;
  onClose: () => void;
}) {
  const isInv = field === 'inv';
  const [qty, setQty] = useState<UnitQty>(() => ({ ...(value ?? {}) }));
  const [unit, setUnit] = useState<Unit>(() => qtyEntries(value)[0]?.unit ?? 'boxes');
  const cur = qty[unit];
  const [whole, setWhole] = useState<string>(cur != null ? String(Math.floor(cur)) : '');
  const [frac, setFrac] = useState<number>(cur != null ? roundQty(cur - Math.floor(cur)) : 0);
  const [customOpen, setCustomOpen] = useState(false);
  const [num, setNum] = useState('1');
  const [den, setDen] = useState('3');

  // write the active unit's value — always a single-unit breakdown (boxes XOR packs)
  const emit = (w: string, f: number) => {
    const out: UnitQty = {};
    if (!(w === '' && f === 0)) out[unit] = roundQty((parseInt(w, 10) || 0) + f);
    setQty(out);
    onChange(out);
  };
  const setW = (raw: string) => { const c = raw.replace(/[^0-9]/g, ''); setWhole(c); emit(c, frac); };
  const setF = (f: number) => { setFrac(f); if (f === 0) setCustomOpen(false); emit(whole, f); };
  const step = (d: number) => setW(String(Math.max(0, (parseInt(whole, 10) || 0) + d)));
  const applyCustom = () => {
    const v = parseFraction(parseInt(num, 10), parseInt(den, 10));
    if (v === null || v < 0) return;
    const w = (parseInt(whole, 10) || 0) + Math.floor(v);
    const f = roundQty(v - Math.floor(v));
    setWhole(String(w)); setFrac(f); setCustomOpen(false); emit(String(w), f);
  };

  // switch the unit label — quantity is preserved (same number, different label)
  const selectUnit = (u: Unit) => {
    if (u === unit) return;
    const currentVal = qty[unit];
    const out: UnitQty = currentVal != null ? ({ [u]: currentVal } as UnitQty) : {};
    setQty(out);
    onChange(out);
    setUnit(u);
  };

  const clearAll = () => { setQty({}); onChange({}); onClose(); };
  const applyRecent = (r: UnitQty) => { setQty({ ...r }); onChange({ ...r }); onClose(); };

  const fracGlyph = frac > 0 ? (FRACTIONS.find((x) => Math.abs(x.value - frac) < 0.02)?.glyph ?? formatQty(frac)) : '';
  const totalGlyph = hasQty(qty) ? formatUnitQtyLong(qty) : (isInv ? '—' : 'X');

  return (
    <div className="celled">
      <div className="celled__head">
        <div className="celled__title">{isInv ? 'Inventory' : 'Order'} <span>· {item.name}</span></div>
        <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={onClose} aria-label="close"><Icon name="x" size={18} strokeWidth={2.4} /></button>
      </div>

      <div className="seg" role="radiogroup" aria-label="Unit" style={{ marginBottom: 10 }}>
        {UNIT_DISPLAY_ORDER.map((u) => (
          <button key={u} type="button" role="radio" aria-checked={unit === u}
            className={`seg__opt ${unit === u ? 'seg__opt--active is-delivery' : ''}`}
            style={{ textTransform: 'capitalize' }}
            onClick={() => selectUnit(u)}>
            {u}
          </button>
        ))}
      </div>

      <div className="celled__row">
        <div className="bignum">
          <button className="bignum__btn" onClick={() => step(-1)} aria-label="minus"><Icon name="minus" size={20} /></button>
          <input autoFocus className="bignum__val" inputMode="numeric" value={whole} placeholder="0"
            onChange={(e) => setW(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onClose(); }} />
          <button className="bignum__btn" onClick={() => step(1)} aria-label="plus"><Icon name="plus" size={20} /></button>
        </div>
        {isInv && (
          <div className="fracbox" aria-label="fraction">
            <span className="fracbox__lbl">Fraction</span>
            <span className={`fracbox__val ${frac === 0 ? 'is-none' : ''}`}>{frac > 0 ? fracGlyph : 'none'}</span>
          </div>
        )}
        <button className="recchip recchip--x" onClick={clearAll}>{isInv ? 'Clear' : <><Icon name="x" size={13} /> No order</>}</button>
      </div>

      <div className="celled__total">Total: <b>{totalGlyph}</b></div>

      {isInv && (
        <div className="fracchips">
          <button className={`recchip ${frac === 0 ? 'recchip--on' : ''}`} onClick={() => setF(0)}>None</button>
          {CHIPS.map((c) => (
            <button key={c.glyph} className={`recchip ${Math.abs(frac - c.value) < 0.02 ? 'recchip--on' : ''}`} onClick={() => setF(c.value)}>{c.glyph}</button>
          ))}
          <button className={`recchip ${customOpen ? 'recchip--on' : ''}`} onClick={() => setCustomOpen((o) => !o)}>Custom</button>
        </div>
      )}

      {isInv && customOpen && (
        <div className="fraccustom">
          <input className="input fraccustom__n" inputMode="numeric" value={num} onChange={(e) => setNum(e.target.value.replace(/[^0-9]/g, ''))} aria-label="numerator" />
          <span className="fraccustom__slash">/</span>
          <input className="input fraccustom__n" inputMode="numeric" value={den} onChange={(e) => setDen(e.target.value.replace(/[^0-9]/g, ''))} aria-label="denominator" />
          <button className="recchip recchip--on" onClick={applyCustom}>Apply</button>
        </div>
      )}

      <div className="recents">
        <div className="recents__lbl">{recents.length ? 'Recently used' : 'No history yet'}</div>
        {recents.length > 0 ? (
          <div className="recchips">
            {recents.map((r, i) => <button key={qtyKey(r) + i} className="recchip recchip--x" onClick={() => applyRecent(r)}>{formatUnitQtyLong(r)}</button>)}
          </div>
        ) : (
          <div className="recchip--none">First time counting this item — enter a value above.</div>
        )}
      </div>
    </div>
  );
}

function TrkRow({
  item, line, activeField, onActivate, onClose, recentInv, recentOrd, setInv, setOrd,
}: {
  item: TrackItemVM;
  line: LineValue | undefined;
  activeField: 'inv' | 'ord' | null;
  onActivate: (f: 'inv' | 'ord') => void;
  onClose: () => void;
  recentInv: UnitQty[];
  recentOrd: UnitQty[];
  setInv: (q: UnitQty) => void;
  setOrd: (q: UnitQty) => void;
}) {
  const inv = line?.inv;
  const ord = line?.ord;
  return (
    <div className="trk-row">
      <div className="trk-row__main">
        <div style={{ minWidth: 0 }}>
          <div className="trk-row__name">{item.name}</div>
        </div>
        <button className={`cell cell--inv ${hasQty(inv) ? 'cell--has cell--multi' : ''} ${activeField === 'inv' ? 'cell--active' : ''}`}
          onClick={() => (activeField === 'inv' ? onClose() : onActivate('inv'))}>
          <CellQty qty={inv} empty="–" />
        </button>
        <button className={`cell cell--ord ${hasQty(ord) ? 'cell--has cell--multi' : 'cell--x'} ${activeField === 'ord' ? 'cell--active' : ''}`}
          onClick={() => (activeField === 'ord' ? onClose() : onActivate('ord'))}>
          <CellQty qty={ord} empty="X" />
        </button>
      </div>
      {activeField && (
        <CellEditor key={activeField} item={item} field={activeField}
          value={activeField === 'inv' ? inv : ord}
          recents={activeField === 'inv' ? recentInv : recentOrd}
          onChange={(q) => (activeField === 'inv' ? setInv(q) : setOrd(q))}
          onClose={onClose} />
      )}
    </div>
  );
}

export function Tracking({
  mode, categories, initialLines = {}, initialNote = '', initialDateMs,
  recentInv, recentOrd, onSave, onCancel,
}: {
  mode: 'new' | 'edit';
  categories: TrackCategoryVM[];
  initialLines?: Lines;
  initialNote?: string;
  initialDateMs?: number;
  recentInv: (itemId: string) => UnitQty[];
  recentOrd: (itemId: string) => UnitQty[];
  onSave: (out: { lines: Lines; note: string; dateMs: number }) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [lines, setLines] = useState<Lines>(() => JSON.parse(JSON.stringify(initialLines)));
  const [note, setNote] = useState(initialNote);
  const [date, setDate] = useState(() => {
    const ms = initialDateMs ?? Date.now();
    return new Date(ms).toISOString().slice(0, 10);
  });
  const [active, setActive] = useState<string | null>(null); // `${itemId}:${field}`
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [filter, setFilter] = useState<'all' | 'order'>('all');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const allItems = categories.flatMap((c) => c.items);
  const total = allItems.length;
  const countedN = allItems.filter((i) => hasQty(lines[i.id]?.inv)).length;
  const orderN = allItems.filter((i) => hasQty(lines[i.id]?.ord)).length;

  const setField = (id: string, field: 'inv' | 'ord', q: UnitQty) => {
    markDirty();
    setLines((prev) => {
      const next = { ...prev };
      const ln: LineValue = { ...(next[id] || {}) };
      if (hasQty(q)) ln[field] = q; else delete ln[field];
      if (!hasQty(ln.inv) && !hasQty(ln.ord)) delete next[id]; else next[id] = ln;
      return next;
    });
  };

  const toggleCat = (id: string) =>
    setCollapsed((prev) => {
      const n = new Set(prev);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });

  // ── autosave: debounced persist on every edit ────────────────
  // New trackings are not created until the first value is entered, so we never
  // write empty docs. Once a value exists, edits flush ~800ms after typing stops.
  // 'saving' is set by the edit handlers (markDirty); the effect only performs
  // the debounced write and flips to 'saved' when it lands.
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const markDirty = () => setSaveStatus('saving');
  const onSaveRef = useRef(onSave);
  useEffect(() => { onSaveRef.current = onSave; });
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    // hold off until the new tracking has at least one value to persist
    if (mode === 'new' && countedN === 0 && orderN === 0) return;
    const tid = setTimeout(() => {
      const clean: Lines = {};
      for (const k in lines) {
        const l = lines[k];
        if (hasQty(l.inv) || hasQty(l.ord)) clean[k] = l;
      }
      Promise.resolve(
        onSaveRef.current({ lines: clean, note, dateMs: new Date(date + 'T12:00:00').getTime() }),
      ).then(() => setSaveStatus('saved'));
    }, 800);
    return () => clearTimeout(tid);
  }, [lines, note, date, mode, countedN, orderN]);

  return (
    <div className="it-app screen">
      <FlowHeader title={mode === 'edit' ? 'Edit tracking' : 'New tracking'} backIcon="x" onBack={onCancel} />

      <div style={{ flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '2px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
          <span style={{ color: 'var(--ink-3)' }}><Icon name="calendar" size={17} /></span>
          <input type="date" className="input" style={{ height: 40, width: 'auto', flex: 1, fontSize: 15 }} value={date} onChange={(e) => { markDirty(); setDate(e.target.value); }} />
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span className="eyebrow">Counted</span><span className="mono t-sm fw-6">{countedN}/{total}</span></div>
            <div className="level"><div className="level__fill" style={{ width: `${total ? (countedN / total) * 100 : 0}%`, background: 'var(--accent)' }} /></div>
          </div>
          <div style={{ width: 1, background: 'var(--border)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span className="eyebrow">To order</span><span className="mono t-sm fw-6" style={{ color: orderN ? 'var(--low-text)' : 'var(--ink-3)' }}>{orderN}</span></div>
            <div className="level"><div className="level__fill" style={{ width: `${total ? (orderN / total) * 100 : 0}%`, background: 'var(--low)' }} /></div>
          </div>
        </div>
        <label className="search" style={{ marginTop: 12, height: 40 }}>
          <span style={{ color: 'var(--ink-3)', display: 'flex' }}><Icon name="search" size={17} /></span>
          <input value={query} placeholder="Search items" onChange={(e) => setQuery(e.target.value)} />
          {query && <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => setQuery('')} aria-label="clear search"><Icon name="x" size={15} /></button>}
        </label>
        <div className="chips" style={{ marginTop: 10 }}>
          <button className={`chip ${filter === 'all' ? 'chip--active' : ''}`} onClick={() => setFilter('all')}>All items <span className="chip__count">{total}</span></button>
          <button className={`chip ${filter === 'order' ? 'chip--active' : ''}`} onClick={() => setFilter('order')}><Icon name="truck" size={14} /> To order <span className="chip__count">{orderN}</span></button>
        </div>
      </div>

      <div className="scroll">
        <div className="pad stack" style={{ gap: 12 }}>
          {filter === 'order' && orderN === 0 && (
            <div className="card"><Empty icon="truck" title="Nothing to order yet" body="Set an order quantity on any item and it’ll show up here." action={<Button variant="secondary" onClick={() => setFilter('all')}>Show all items</Button>} /></div>
          )}
          {categories.map((c) => {
            const ordSet = (i: TrackItemVM) => hasQty(lines[i.id]?.ord);
            let visItems = filter === 'order' ? c.items.filter(ordSet) : c.items;
            if (q) visItems = visItems.filter((i) => i.name.toLowerCase().includes(q));
            if (visItems.length === 0) return null;
            const isCol = q ? false : filter === 'order' ? false : collapsed.has(c.id);
            const cCounted = c.items.filter((i) => hasQty(lines[i.id]?.inv)).length;
            const cOrder = c.items.filter(ordSet).length;
            const done = cCounted === c.items.length;
            return (
              <div key={c.id} className="card card--flush">
                <button className="trk-cat" onClick={() => { if (filter !== 'order') toggleCat(c.id); }} style={filter === 'order' ? { cursor: 'default' } : undefined}>
                  <span style={{ color: 'var(--ink-3)', transform: isCol ? 'rotate(-90deg)' : 'none', transition: 'transform .15s', opacity: filter === 'order' ? 0 : 1 }}><Icon name="chevD" size={16} /></span>
                  <span className="trk-cat__name">{c.label}</span>
                  {cOrder > 0 && <span className="badge badge--low" style={{ height: 20 }}><span className="dot" />{cOrder}</span>}
                  <span className={`trk-cat__count ${done ? 'is-done' : ''}`}>{filter === 'order' ? visItems.length : `${cCounted}/${c.items.length}`}</span>
                </button>
                {!isCol && (
                  <>
                    <div className="trk-colhead"><span>Order List</span><span className="r">Inv</span><span className="r">Ord</span></div>
                    {visItems.map((i) => {
                      const af = active && active.startsWith(i.id + ':') ? (active.split(':')[1] as 'inv' | 'ord') : null;
                      return (
                        <TrkRow key={i.id} item={i} line={lines[i.id]} activeField={af}
                          onActivate={(f) => setActive(i.id + ':' + f)} onClose={() => setActive(null)}
                          recentInv={recentInv(i.id)} recentOrd={recentOrd(i.id)}
                          setInv={(v) => setField(i.id, 'inv', v)} setOrd={(v) => setField(i.id, 'ord', v)} />
                      );
                    })}
                  </>
                )}
              </div>
            );
          })}

          <div className="field" style={{ marginTop: 2 }}>
            <label className="label">Other notes <span className="muted-2" style={{ fontWeight: 500 }}>· optional</span></label>
            <input className="input" value={note} placeholder="e.g. weekend prep, delivery Tuesday" onChange={(e) => { markDirty(); setNote(e.target.value); }} />
          </div>
          <div style={{ height: 8 }} />
        </div>
      </div>

      <div className="actionbar">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, color: 'var(--ink-3)', fontSize: 14, fontWeight: 600 }}>
          {saveStatus === 'saving' ? (
            <><Icon name="clock" size={16} /> Saving…</>
          ) : saveStatus === 'saved' ? (
            <><span style={{ color: 'var(--accent)', display: 'flex' }}><Icon name="checkCircle" size={16} strokeWidth={2.2} /></span> All changes saved{countedN > 0 ? ` · ${countedN} counted` : ''}</>
          ) : (
            <>Changes save automatically</>
          )}
        </div>
      </div>
    </div>
  );
}
