// TrackingDetail.tsx — saved tracking: filter, copy order, delivery verification,
// export PDF. PRESENTATIONAL ONLY.
//
// THE SEAM: the container passes the saved tracking grouped by category (read
// from Redux/Firestore) and implements onSetDelivery (persist line.dlv),
// onEdit, onDelete. Clipboard + print are browser UX handled here.
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../ui/Icon';
import { Button, Empty, FlowHeader, SheetModal } from '../ui/primitives';
import { formatQty } from '../lib/quantity';
import { formatUnitQtyLong, hasQty, qtyEntries, UNIT_ABBR, UNIT_DISPLAY_ORDER, type Unit, type UnitQty } from '../lib/units';

export interface DeliveryCheck { ok: boolean; arrived?: UnitQty; note?: string; }
export interface DetailRowVM {
  itemId: string;
  name: string;
  inv?: UnitQty;
  ord?: UnitQty;
  dlv?: DeliveryCheck;
}
export interface DetailCategoryVM { id: string; label: string; rows: DetailRowVM[]; }
export interface TrackingDetailVM {
  id: string;
  dateMs: number;
  by: string;
  note: string;
  categories: DetailCategoryVM[];   // all recorded rows, grouped
}

const fmtDate = (ms: number) => new Date(ms).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

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
const fmtDateLong = (ms: number) => new Date(ms).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
function relTime(ms: number) {
  const mins = Math.round((Date.now() - ms) / 60000);
  if (mins < 60) return mins <= 0 ? 'just now' : `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d}d ago`;
}

// ── delivery sub-components ──────────────────────────────────
function DeliverySub({ row }: { row: DetailRowVM }) {
  if (!hasQty(row.ord) || !row.dlv) return null;
  if (row.dlv.ok) {
    return <div className="trk-row__sub--dlv is-ok"><Icon name="check" size={12} strokeWidth={2.6} /><span>Received in full</span></div>;
  }
  return (
    <div className="trk-row__sub--dlv is-bad">
      <Icon name="alert" size={12} strokeWidth={2.2} />
      <span>Got {formatUnitQtyLong(row.dlv.arrived)} of {formatUnitQtyLong(row.ord)}</span>
    </div>
  );
}

function DeliveryCell({ row, active, onClick }: { row: DetailRowVM; active: boolean; onClick: () => void }) {
  if (!hasQty(row.ord)) return <div className="cell cell--dlv cell--dlv-na">·</div>;
  const d = row.dlv;
  const content: ReactNode = d
    ? <CellQty qty={d.ok ? row.ord : d.arrived} empty="–" />
    : <Icon name="box" size={16} />;
  return (
    <button
      className={`cell cell--dlv ${d ? (d.ok ? 'cell--dlv-ok' : 'cell--dlv-bad') : ''} ${active ? 'cell--active' : ''}`}
      onClick={onClick}
      aria-label="delivery check"
    >
      {content}
    </button>
  );
}

function DeliveryEditor({ row, onSave, onClose }: { row: DetailRowVM; onSave: (d: DeliveryCheck | null) => void; onClose: () => void }) {
  const ord = row.ord ?? {};
  const ordUnits = UNIT_DISPLAY_ORDER.filter((u) => ord[u] != null);

  const [arrived, setArrived] = useState<UnitQty>(() =>
    row.dlv && !row.dlv.ok && row.dlv.arrived ? { ...row.dlv.arrived } : { ...ord },
  );
  const [note, setNote] = useState(row.dlv?.note ?? '');

  const isFullDelivery = ordUnits.every((u) => (arrived[u] ?? 0) >= (ord[u] ?? 0));

  const persist = (a: UnitQty, n: string) => {
    const full = ordUnits.every((u) => (a[u] ?? 0) >= (ord[u] ?? 0));
    onSave({ ok: full, ...(full ? {} : { arrived: a }), note: n.trim() });
  };

  const updateUnit = (u: Unit, raw: string) => {
    const n = Math.max(0, parseInt(raw.replace(/[^0-9]/g, ''), 10) || 0);
    const next: UnitQty = { ...arrived, [u]: n };
    setArrived(next);
    persist(next, note);
  };

  const step = (u: Unit, d: number) => {
    const next: UnitQty = { ...arrived, [u]: Math.max(0, (arrived[u] ?? 0) + d) };
    setArrived(next);
    persist(next, note);
  };

  const setNoteAndSave = (v: string) => { setNote(v); persist(arrived, v); };

  return (
    <div className="celled">
      <div className="celled__head">
        <div className="celled__title">Product check <span>· {row.name}</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {row.dlv && <button className="btn btn--sm btn--danger" style={{ background: 'var(--out-bg)' }} onClick={() => { onSave(null); onClose(); }}>Did not arrive yet</button>}
          <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={onClose} aria-label="collapse"><Icon name="x" size={18} strokeWidth={2.4} /></button>
        </div>
      </div>

      <div className="dlv-arrived">
        <span className="dlv-arrived__lbl">How many arrived?</span>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {ordUnits.map((u) => (
            <div key={u} style={{ flex: 1 }}>
              <div className="eyebrow" style={{ marginBottom: 4, textTransform: 'capitalize' }}>
                {u} <span className="muted-2">· of {ord[u]}</span>
              </div>
              <div className="bignum" style={{ height: 42 }}>
                <button className="bignum__btn" style={{ width: 36 }} onClick={() => step(u, -1)} aria-label={`minus ${u}`}>
                  <Icon name="minus" size={16} />
                </button>
                <input
                  className="bignum__val"
                  style={{ fontSize: 16 }}
                  inputMode="numeric"
                  value={arrived[u] ?? ''}
                  placeholder="0"
                  onChange={(e) => updateUnit(u, e.target.value)}
                />
                <button className="bignum__btn" style={{ width: 36 }} onClick={() => step(u, 1)} aria-label={`plus ${u}`}>
                  <Icon name="plus" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {!isFullDelivery && (
          <button className="recchip" style={{ marginTop: 10 }} onClick={() => {
            const next = { ...ord };
            setArrived(next);
            persist(next, note);
          }}>
            Mark as full delivery
          </button>
        )}
      </div>

      <div className="dlv-cmt">
        <div className="dlv-cmt__lbl">Comment · quality &amp; condition</div>
        <textarea value={note} placeholder="e.g. produce a little soft, two cases short, dates tight" onChange={(e) => setNoteAndSave(e.target.value)} />
      </div>
    </div>
  );
}

// ── print sheet (hidden except @media print) ─────────────────
function PrintSheet({ t, onlyOrder, onClose }: { t: TrackingDetailVM; onlyOrder: boolean; onClose: () => void }) {
  const cats = t.categories
    .map((c) => ({ ...c, rows: c.rows.filter((r) => (onlyOrder ? hasQty(r.ord) : hasQty(r.inv) || hasQty(r.ord))) }))
    .filter((c) => c.rows.length);
  const counted = t.categories.reduce((s, c) => s + c.rows.filter((r) => hasQty(r.inv)).length, 0);
  const ordered = t.categories.reduce((s, c) => s + c.rows.filter((r) => hasQty(r.ord)).length, 0);

  useEffect(() => {
    const tid = setTimeout(() => { try { window.print(); } catch { /* ignore */ } onClose(); }, 250);
    return () => clearTimeout(tid);
  }, [onClose]);

  return createPortal(
    <div className="print-host">
      <div className="psheet">
        <div className="psheet__head">
          <div>
            <div className="psheet__brand">Inventory Tracking</div>
            <div className="psheet__date">{fmtDateLong(t.dateMs)}</div>
          </div>
          <div className="psheet__meta"><div><b>{counted}</b> counted</div><div><b>{ordered}</b> to order</div></div>
        </div>
        {(t.note || onlyOrder) && (
          <div className="psheet__sub">
            {onlyOrder && <span className="psheet__tag">Order list only</span>}
            {t.note && <span className="psheet__note">Note: {t.note}</span>}
          </div>
        )}
        <div className="psheet__cats">
          {cats.map((c) => (
            <div key={c.id} className="psheet__cat">
              <table className="ptable">
                <thead><tr><th>{c.label}</th><th className="n">INV</th><th className="n">ORD</th><th className="n">RCV</th></tr></thead>
                <tbody>
                  {c.rows.map((r) => {
                    const d = r.dlv;
                    let got: ReactNode;
                    let gotCls = 'n';
                    if (!hasQty(r.ord)) got = '';
                    else if (!d) { got = '–'; gotCls = 'n x'; }
                    else if (d.ok) got = formatUnitQtyLong(r.ord);
                    else { got = formatUnitQtyLong(d.arrived); gotCls = 'n x'; }
                    return (
                      <tr key={r.itemId}>
                        <td>{r.name}</td>
                        <td className="n">{hasQty(r.inv) ? formatUnitQtyLong(r.inv) : '–'}</td>
                        <td className={`n ${hasQty(r.ord) ? '' : 'x'}`}>{hasQty(r.ord) ? formatUnitQtyLong(r.ord) : 'X'}</td>
                        <td className={gotCls}>{got}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function TrackingDetail({
  tracking, onSetDelivery, onEdit, onDelete, onBack,
}: {
  tracking: TrackingDetailVM;
  onSetDelivery: (itemId: string, dlv: DeliveryCheck | null) => void;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}) {
  const t = tracking;
  const [filter, setFilter] = useState<'all' | 'order' | 'check'>('order');
  const [activeDlv, setActiveDlv] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const counted = t.categories.reduce((s, c) => s + c.rows.filter((r) => hasQty(r.inv)).length, 0);
  const ordered = t.categories.reduce((s, c) => s + c.rows.filter((r) => hasQty(r.ord)).length, 0);
  const toCheck = t.categories.reduce((s, c) => s + c.rows.filter((r) => hasQty(r.ord) && !r.dlv).length, 0);

  const copyOrder = () => {
    let out = `ORDER — ${fmtDateLong(t.dateMs)}\n`;
    if (t.note) out += `Note: ${t.note}\n`;
    t.categories.forEach((c) => {
      const rows = c.rows.filter((r) => hasQty(r.ord));
      if (!rows.length) return;
      out += `\n${c.label}\n`;
      rows.forEach((r) => { out += `  • ${r.name}: ${formatUnitQtyLong(r.ord)}\n`; });
    });
    if (navigator.clipboard) navigator.clipboard.writeText(out.trim()).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="it-app screen">
      <FlowHeader title={fmtDate(t.dateMs)} sub="Inventory tracking" onBack={onBack}
        trailing={<button className="btn btn--secondary btn--sm" onClick={onEdit}><Icon name="edit" size={15} /> Edit</button>} />

      <div className="scroll">
        <div className="pad stack" style={{ gap: 16 }}>
          <div className="card card--pad" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', gap: 22, flex: 1 }}>
              <div>
                <div className="mono fw-7" style={{ fontSize: 28, lineHeight: 1, color: 'var(--accent-text)' }}>{counted}</div>
                <div className="eyebrow" style={{ marginTop: 5 }}>Counted</div>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div>
                <div className="mono fw-7" style={{ fontSize: 28, lineHeight: 1, color: ordered ? 'var(--low-text)' : 'var(--ink-4)' }}>{ordered}</div>
                <div className="eyebrow" style={{ marginTop: 5 }}>To order</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="t-sm fw-6">{fmtDateLong(t.dateMs)}</div>
              <div className="muted-2" style={{ fontSize: 12, marginTop: 2 }}>by {t.by} · {relTime(t.dateMs)}</div>
            </div>
          </div>

          {t.note && (
            <div className="alert alert--low" style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
              <div className="alert__body" style={{ color: 'var(--low-text)', margin: 0 }}>{t.note}</div>
              <span className="alert__icon" style={{ color: 'var(--low)', opacity: 0.6 }}><Icon name="note" size={16} /></span>
            </div>
          )}

          <div className="chips">
            <button className={`chip ${filter === 'all' ? 'chip--active' : ''}`} onClick={() => setFilter('all')}>All recorded <span className="chip__count">{counted}</span></button>
            <button className={`chip ${filter === 'order' ? 'chip--active' : ''}`} onClick={() => setFilter('order')}><Icon name="truck" size={14} /> To order <span className="chip__count">{ordered}</span></button>
            {ordered > 0 && <button className={`chip ${filter === 'check' ? 'chip--active' : ''}`} onClick={() => setFilter('check')}><Icon name="box" size={14} /> To check <span className="chip__count">{toCheck}</span></button>}
          </div>

          {filter === 'order' && ordered === 0 && (
            <div className="card"><Empty icon="truck" title="Nothing was ordered" body="This tracking recorded counts only." action={<Button variant="secondary" onClick={() => setFilter('all')}>Show all</Button>} /></div>
          )}
          {filter === 'check' && toCheck === 0 && (
            <div className="card"><Empty icon="checkCircle" title="All products checked" body="Every ordered item has been validated against what arrived." action={<Button variant="secondary" onClick={() => setFilter('order')}>Review orders</Button>} /></div>
          )}

          {t.categories.map((c) => {
            let rows = c.rows.filter((r) => hasQty(r.inv) || hasQty(r.ord));
            if (filter === 'order') rows = rows.filter((r) => hasQty(r.ord));
            if (filter === 'check') rows = rows.filter((r) => hasQty(r.ord) && (!r.dlv || r.itemId === activeDlv));
            if (!rows.length) return null;
            return (
              <div key={c.id} className="card card--flush">
                <div className="trk-cat" style={{ cursor: 'default' }}>
                  <span className="trk-cat__name">{c.label}</span>
                  <span className="trk-cat__count">{rows.length}</span>
                </div>
                <div className="trk-colhead trk-colhead--dlv"><span>Order List</span><span className="r">Inv</span><span className="r">Ord</span><span className="r">Rcv</span></div>
                {rows.map((r) => {
                  const open = activeDlv === r.itemId;
                  return (
                    <div key={r.itemId} className="trk-row">
                      <div className="trk-row__main trk-row__main--dlv">
                        <div style={{ minWidth: 0 }}>
                          <div className="trk-row__name">{r.name}</div>
                          <DeliverySub row={r} />
                          {r.dlv?.note && <div className="dlv-comment-line">"{r.dlv.note}"</div>}
                        </div>
                        <div className={`cell cell--inv ${hasQty(r.inv) ? 'cell--has cell--multi' : ''}`} style={{ cursor: 'default' }}>
                          <CellQty qty={r.inv} empty="–" />
                        </div>
                        <div className={`cell cell--ord ${hasQty(r.ord) ? 'cell--has cell--multi' : 'cell--x'}`} style={{ cursor: 'default' }}>
                          <CellQty qty={r.ord} empty="X" />
                        </div>
                        <DeliveryCell row={r} active={open} onClick={() => {
                          if (!hasQty(r.ord)) return;
                          if (open) { setActiveDlv(null); return; }
                          // first open defaults to a full delivery
                          if (!r.dlv) onSetDelivery(r.itemId, { ok: true });
                          setActiveDlv(r.itemId);
                        }} />
                      </div>
                      {open && hasQty(r.ord) && (
                        <DeliveryEditor row={r} onSave={(d) => onSetDelivery(r.itemId, d)} onClose={() => setActiveDlv(null)} />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          <div style={{ display: 'flex', gap: 10 }}>
            {ordered > 0 && <Button variant="secondary" block icon={copied ? 'check' : 'copy'} onClick={copyOrder}>{copied ? 'Copied' : 'Copy order'}</Button>}
            <Button variant="secondary" block icon="download" onClick={() => setPrinting(true)}>Export PDF</Button>
          </div>
          <Button variant="danger" block icon="trash" onClick={() => setConfirmDel(true)}>Delete tracking</Button>
          <div className="content-pad-bottom" />
        </div>
      </div>

      {printing && <PrintSheet t={t} onlyOrder={filter === 'order'} onClose={() => setPrinting(false)} />}

      {confirmDel && (
        <SheetModal onClose={() => setConfirmDel(false)}>
          <div style={{ padding: '20px 20px 8px' }}>
            <div className="t-lg fw-7">Delete this tracking?</div>
            <div className="muted" style={{ fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>The {fmtDate(t.dateMs)} count and order will be permanently removed. Recent values from other trackings are unaffected.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
              <Button variant="danger" size="lg" block icon="trash" onClick={() => { onDelete(); setConfirmDel(false); }}>Delete</Button>
              <Button variant="ghost" size="lg" block onClick={() => setConfirmDel(false)}>Cancel</Button>
            </div>
          </div>
        </SheetModal>
      )}
    </div>
  );
}
