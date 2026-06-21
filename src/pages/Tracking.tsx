// Tracking.tsx — the walk: record INV + ORD per item, with recent-value chips.
// PRESENTATIONAL ONLY.
//
// THE SEAM: the container passes the active catalog grouped by category, the
// existing lines (for edit), and recentInv/recentOrd lookups derived from this
// restaurant's past trackings (Redux/Firestore). onSave receives the cleaned
// lines + note + date; you persist them to restaurants/{rid}/trackings.
import { useState } from 'react';
import { Icon } from '../ui/Icon';
import { Button, Empty, FlowHeader } from '../ui/primitives';

export type LineValue = { inv?: number | ''; ord?: number | null };
export type Lines = Record<string, LineValue>;

export interface TrackItemVM { id: string; name: string; unit: string; }
export interface TrackCategoryVM { id: string; label: string; items: TrackItemVM[]; }

const has = (v: unknown) => v !== undefined && v !== null && v !== '';
const fmtNum = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100));

// ── inline cell editor ───────────────────────────────────────
function CellEditor({
  item, field, value, recents, onChange, onClose,
}: {
  item: TrackItemVM;
  field: 'inv' | 'ord';
  value: number | null | '' | undefined;
  recents: number[];
  onChange: (v: number | null | '') => void;
  onClose: () => void;
}) {
  const isInv = field === 'inv';
  const cur = has(value) ? String(value) : '';
  const [txt, setTxt] = useState(cur);

  const commit = (raw: string) => {
    const clean = raw.replace(/[^0-9.]/g, '');
    setTxt(clean);
    onChange(clean === '' ? (isInv ? '' : null) : +clean);
  };
  const step = (d: number) => {
    const base = txt === '' ? 0 : +txt || 0;
    commit(String(Math.max(0, base + d)));
  };

  return (
    <div className="celled">
      <div className="celled__head">
        <div className="celled__title">{isInv ? 'Inventory' : 'Order'} <span>· {item.name}</span></div>
        <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={onClose} aria-label="done"><Icon name="check" size={18} strokeWidth={2.4} /></button>
      </div>

      <div className="celled__row">
        <div className="bignum">
          <button className="bignum__btn" onClick={() => step(-1)} aria-label="minus"><Icon name="minus" size={20} /></button>
          <input autoFocus className="bignum__val" inputMode="decimal" value={txt} placeholder={isInv ? '0' : 'X'}
            onChange={(e) => commit(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onClose(); }} />
          <button className="bignum__btn" onClick={() => step(1)} aria-label="plus"><Icon name="plus" size={20} /></button>
        </div>
        {isInv
          ? <button className="recchip recchip--x" onClick={() => { onChange(''); onClose(); }}>Clear</button>
          : <button className="recchip recchip--x" onClick={() => { onChange(null); onClose(); }}><Icon name="x" size={13} /> No order</button>}
      </div>

      <div className="recents">
        <div className="recents__lbl">{recents.length ? 'Recently used' : 'No history yet'}</div>
        {recents.length > 0 ? (
          <div className="recchips">
            {recents.map((v) => <button key={v} className="recchip" onClick={() => { onChange(v); onClose(); }}>{v}</button>)}
          </div>
        ) : (
          <div className="recchip--none">First time counting this item — type a value above.</div>
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
  recentInv: number[];
  recentOrd: number[];
  setInv: (v: number | '' ) => void;
  setOrd: (v: number | null) => void;
}) {
  const inv = line?.inv;
  const ord = line?.ord;
  return (
    <div className="trk-row">
      <div className="trk-row__main">
        <div style={{ minWidth: 0 }}>
          <div className="trk-row__name">{item.name}</div>
          <div className="trk-row__sub">{item.unit}</div>
        </div>
        <button className={`cell cell--inv ${has(inv) ? 'cell--has' : ''} ${activeField === 'inv' ? 'cell--active' : ''}`}
          onClick={() => (activeField === 'inv' ? onClose() : onActivate('inv'))}>
          {has(inv) ? fmtNum(inv as number) : '–'}
        </button>
        <button className={`cell cell--ord ${has(ord) ? 'cell--has' : 'cell--x'} ${activeField === 'ord' ? 'cell--active' : ''}`}
          onClick={() => (activeField === 'ord' ? onClose() : onActivate('ord'))}>
          {has(ord) ? fmtNum(ord as number) : 'X'}
        </button>
      </div>
      {activeField && (
        <CellEditor item={item} field={activeField}
          value={activeField === 'inv' ? inv : ord}
          recents={activeField === 'inv' ? recentInv : recentOrd}
          onChange={(v) => (activeField === 'inv' ? setInv(v as number | '') : setOrd(v as number | null))}
          onClose={onClose} />
      )}
    </div>
  );
}

export function Tracking({
  mode, categories, initialLines = {}, initialNote = '', initialDateMs = Date.now(),
  recentInv, recentOrd, onSave, onCancel,
}: {
  mode: 'new' | 'edit';
  categories: TrackCategoryVM[];
  initialLines?: Lines;
  initialNote?: string;
  initialDateMs?: number;
  recentInv: (itemId: string) => number[];
  recentOrd: (itemId: string) => number[];
  onSave: (out: { lines: Lines; note: string; dateMs: number }) => void;
  onCancel: () => void;
}) {
  const [lines, setLines] = useState<Lines>(() => JSON.parse(JSON.stringify(initialLines)));
  const [note, setNote] = useState(initialNote);
  const [date, setDate] = useState(() => new Date(initialDateMs).toISOString().slice(0, 10));
  const [active, setActive] = useState<string | null>(null); // `${itemId}:${field}`
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [filter, setFilter] = useState<'all' | 'order'>('all');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const allItems = categories.flatMap((c) => c.items);
  const total = allItems.length;
  const countedN = allItems.filter((i) => has(lines[i.id]?.inv)).length;
  const orderN = allItems.filter((i) => has(lines[i.id]?.ord)).length;

  const setField = (id: string, field: 'inv' | 'ord', v: number | null | '') =>
    setLines((prev) => {
      const next = { ...prev };
      const ln: LineValue = { ...(next[id] || {}) };
      if (field === 'inv') { if (v === '') delete ln.inv; else ln.inv = v as number; }
      else { if (v === null || v === '') delete ln.ord; else ln.ord = v as number; }
      if (Object.keys(ln).length === 0) delete next[id]; else next[id] = ln;
      return next;
    });

  const toggleCat = (id: string) =>
    setCollapsed((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const save = () => {
    const clean: Lines = {};
    for (const k in lines) {
      const l = lines[k];
      if (has(l.inv) || has(l.ord)) clean[k] = l;
    }
    onSave({ lines: clean, note, dateMs: new Date(date + 'T12:00:00').getTime() });
  };

  return (
    <div className="it-app screen">
      <FlowHeader title={mode === 'edit' ? 'Edit tracking' : 'New tracking'} backIcon="x" onBack={onCancel} />

      <div style={{ flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '2px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
          <span style={{ color: 'var(--ink-3)' }}><Icon name="calendar" size={17} /></span>
          <input type="date" className="input" style={{ height: 40, width: 'auto', flex: 1, fontSize: 15 }} value={date} onChange={(e) => setDate(e.target.value)} />
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
            const ordSet = (i: TrackItemVM) => has(lines[i.id]?.ord);
            let visItems = filter === 'order' ? c.items.filter(ordSet) : c.items;
            if (q) visItems = visItems.filter((i) => i.name.toLowerCase().includes(q));
            if (visItems.length === 0) return null;
            const isCol = q ? false : filter === 'order' ? false : collapsed.has(c.id);
            const cCounted = c.items.filter((i) => has(lines[i.id]?.inv)).length;
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
            <input className="input" value={note} placeholder="e.g. weekend prep, delivery Tuesday" onChange={(e) => setNote(e.target.value)} />
          </div>
          <div style={{ height: 8 }} />
        </div>
      </div>

      <div className="actionbar">
        <Button variant="primary" block icon="check" disabled={countedN === 0 && orderN === 0} onClick={save}>
          {mode === 'edit' ? 'Save changes' : 'Save tracking'}{countedN + orderN > 0 ? ` · ${countedN} counted` : ''}
        </Button>
      </div>
    </div>
  );
}
