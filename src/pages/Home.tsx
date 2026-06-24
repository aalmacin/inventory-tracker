// Home.tsx — first view after login: add tracking + previous trackings.
// PRESENTATIONAL ONLY.
//
// THE SEAM: the container reads the current restaurant's trackings from Redux
// (Firestore), computes each row's delivery status (none/pending/done) and
// passes them as TrackingRowVM[]. Search + pagination are view-local here.
import { useMemo, useState, type ReactNode } from 'react';
import { Icon } from '../ui/Icon';
import { Button, Empty } from '../ui/primitives';

export interface DeliveryStatus {
  kind: 'none' | 'pending' | 'done';
  open?: number;
  total?: number;
}
export interface TrackingRowVM {
  id: string;
  date: number;        // epoch ms
  note: string;
  delivery: DeliveryStatus;
}

const PAGE_SIZE = 5;
const fmtDate = (ms: number) => new Date(ms).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const STATUS_UI = {
  none: { icon: 'check' as const, text: 'No order placed', color: 'var(--ink-3)' },
  pending: { icon: 'clock' as const, text: 'Waiting for product confirmation', color: 'var(--low-text)' },
  done: { icon: 'checkCircle' as const, text: 'Product confirmed', color: 'var(--ok)' },
};

function TrackingRow({ t, onOpen }: { t: TrackingRowVM; onOpen: () => void }) {
  const ui = STATUS_UI[t.delivery.kind];
  const d = new Date(t.date);
  return (
    <button className="row" onClick={onOpen}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--accent-weak)', border: '1px solid var(--accent-line)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1 }}>
        <span className="mono fw-7" style={{ fontSize: 16, color: 'var(--accent-text)' }}>{d.getDate()}</span>
        <span className="mono" style={{ fontSize: 8.5, color: 'var(--accent-text)', textTransform: 'uppercase', marginTop: 1, opacity: 0.8 }}>{d.toLocaleDateString('en-US', { month: 'short' })}</span>
      </div>
      <div className="row__body">
        <div className="row__title" style={{ fontSize: 14.5 }}>{fmtDate(t.date)}</div>
        <div className="row__sub" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: ui.color, display: 'flex', flexShrink: 0 }}><Icon name={ui.icon} size={14} /></span>
          <span style={{ color: ui.color, fontWeight: 600, flexShrink: 0 }}>{ui.text}</span>
          {t.delivery.kind === 'pending' && <span className="mono" style={{ color: 'var(--ink-3)', flexShrink: 0 }}>{t.delivery.open} of {t.delivery.total}</span>}
          {t.note ? <><span className="dot-sep" /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.note}</span></> : null}
        </div>
      </div>
      <span style={{ color: 'var(--ink-4)' }}><Icon name="chevR" size={17} /></span>
    </button>
  );
}

export function Home({
  header, trackings, itemCount, onNewTracking, onOpenTracking, onBrowseItems,
}: {
  header?: ReactNode;
  trackings: TrackingRowVM[];
  itemCount: number;
  onNewTracking: () => void;
  onOpenTracking: (id: string) => void;
  onBrowseItems: () => void;
}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const q = query.trim().toLowerCase();

  const updateQuery = (newQuery: string) => {
    setQuery(newQuery);
    setPage(0);
  };

  const filtered = useMemo(() => {
    if (!q) return trackings;
    return trackings.filter((t) => `${fmtDate(t.date)} ${t.note}`.toLowerCase().includes(q));
  }, [trackings, q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  return (
    <div className="it-app screen">
      {header ?? <div className="appbar"><div className="appbar__title">Inventory</div></div>}
      <div className="scroll">
        <div className="pad stack" style={{ gap: 18 }}>
          <button onClick={onNewTracking} style={{ width: '100%', textAlign: 'left', background: 'var(--ink)', color: '#fff', borderRadius: 'var(--r-lg)', padding: 16, display: 'flex', alignItems: 'center', gap: 13, boxShadow: 'var(--shadow-md)' }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="count" size={25} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="fw-7" style={{ fontSize: 16.5 }}>Add inventory tracking</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Walk the list · record INV and ORD</div>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}><Icon name="plus" size={22} /></span>
          </button>

          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 9 }}>
              <div className="eyebrow">Previous trackings</div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{trackings.length} total</span>
            </div>

            {trackings.length > 0 && (
              <label className="search" style={{ marginBottom: 9 }}>
                <span style={{ color: 'var(--ink-3)', display: 'flex' }}><Icon name="search" size={18} /></span>
                <input value={query} placeholder="Search by date or note" onChange={(e) => updateQuery(e.target.value)} />
                {query && <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => updateQuery('')} aria-label="clear search"><Icon name="x" size={15} /></button>}
              </label>
            )}

            {trackings.length === 0 ? (
              <div className="card"><Empty icon="history" title="No trackings yet" body="Tap “Add inventory tracking” to record your first count." action={<Button variant="primary" icon="plus" onClick={onNewTracking}>Add tracking</Button>} /></div>
            ) : filtered.length === 0 ? (
              <div className="card"><Empty icon="search" title="No matches" body={`Nothing matches “${query}”.`} action={<Button variant="secondary" onClick={() => updateQuery('')}>Clear search</Button>} /></div>
            ) : (
              <>
                <div className="card card--flush">
                  {pageItems.map((t) => <TrackingRow key={t.id} t={t} onOpen={() => onOpenTracking(t.id)} />)}
                </div>
                {filtered.length > PAGE_SIZE && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                    <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button className="icon-btn" disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} aria-label="previous page"><Icon name="chevL" size={18} /></button>
                      <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-2)', minWidth: 44, textAlign: 'center' }}>{safePage + 1} / {pageCount}</span>
                      <button className="icon-btn" disabled={safePage >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} aria-label="next page"><Icon name="chevR" size={18} /></button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          <button className="card" style={{ padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%' }} onClick={onBrowseItems}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-2)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="items" size={21} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="fw-6" style={{ fontSize: 14.5 }}>Browse items</div>
              <div className="muted-2" style={{ fontSize: 12 }}>{itemCount} items in this restaurant&rsquo;s list</div>
            </div>
            <span style={{ color: 'var(--ink-4)' }}><Icon name="chevR" size={17} /></span>
          </button>

          <div className="content-pad-bottom" />
        </div>
      </div>
    </div>
  );
}
