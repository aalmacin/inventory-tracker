// Restaurants.tsx — admin manages restaurants (locations). PRESENTATIONAL ONLY.
//
// THE SEAM: the container passes each restaurant with live stats (read from
// Redux/Firestore: active item count, tracking count, member count, last count
// time) and implements onOpen / onAddRestaurant / onUpdateRestaurant.
import { useState, type ReactNode } from 'react';
import { Icon } from '../ui/Icon';
import { Button, SheetModal } from '../ui/primitives';

export interface RestaurantStats {
  itemCount: number;
  trackingCount: number;
  memberCount: number;
  lastTrackingMs: number | null;
}
export interface RestaurantStatVM {
  id: string;
  name: string;
  city: string;
  initials: string;
  tint: string;
  isCurrent: boolean;
  stats: RestaurantStats;
}

function relTime(ms: number) {
  const mins = Math.round((Date.now() - ms) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d}d ago`;
}

function RestaurantSheet({
  restaurant, onSave, onClose,
}: {
  restaurant: RestaurantStatVM | null;
  onSave: (input: { name: string; city: string }) => void;
  onClose: () => void;
}) {
  const isEdit = !!restaurant;
  const [name, setName] = useState(restaurant ? restaurant.name : '');
  const [city, setCity] = useState(restaurant ? restaurant.city : '');
  const [touched, setTouched] = useState(false);
  const err = touched && !name.trim();
  const save = () => {
    setTouched(true);
    if (!name.trim()) return;
    onSave({ name: name.trim(), city: city.trim() });
    onClose();
  };
  return (
    <SheetModal onClose={onClose}>
      <div style={{ padding: '18px 20px 10px' }}>
        <div className="t-lg fw-7" style={{ marginBottom: 16 }}>{isEdit ? 'Edit restaurant' : 'New restaurant'}</div>
        <div className="stack" style={{ gap: 13 }}>
          <div className="field">
            <label className="label">Restaurant name <span className="req">*</span></label>
            <input className={`input ${err ? 'input--invalid' : ''}`} value={name} autoFocus placeholder="e.g. Harbor Ramen House" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} />
            {err && <div className="field-err"><Icon name="alert" size={13} /> Name is required.</div>}
          </div>
          <div className="field">
            <label className="label">Location <span className="muted-2" style={{ fontWeight: 500 }}>· optional</span></label>
            <input className="input" value={city} placeholder="e.g. Tacoma, WA" onChange={(e) => setCity(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} />
          </div>
          {!isEdit && (
            <div className="t-sm muted" style={{ lineHeight: 1.5, padding: '0 2px' }}>
              A new restaurant starts with an empty catalog. Add categories and items from the Catalog tab once it&rsquo;s created.
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <Button variant="ghost" block onClick={onClose}>Cancel</Button>
          <Button variant="primary" block onClick={save}>{isEdit ? 'Save' : 'Add restaurant'}</Button>
        </div>
      </div>
    </SheetModal>
  );
}

function RestaurantCard({ r, onOpen, onEdit }: { r: RestaurantStatVM; onOpen: () => void; onEdit: () => void }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <button style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, width: '100%', textAlign: 'left' }} onClick={onOpen}>
        <span className="rest-chip__avatar" style={{ width: 44, height: 44, borderRadius: 12, fontSize: 15, background: r.tint }}>{r.initials}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span className="fw-7" style={{ fontSize: 15.5, letterSpacing: '-0.01em' }}>{r.name}</span>
            {r.isCurrent && <span className="mini-chip" style={{ background: 'var(--accent-weak)', borderColor: 'var(--accent-line)', color: 'var(--accent-text)', height: 20 }}>Current</span>}
          </div>
          <div className="muted-2" style={{ fontSize: 12, marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="pin" size={13} /> {r.city || 'No location set'}
          </div>
        </div>
        <span style={{ color: 'var(--ink-4)' }}><Icon name="chevR" size={18} /></span>
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid var(--border)' }}>
        <div style={{ padding: '11px 14px', borderRight: '1px solid var(--border)' }}>
          <div className="stat-num">{r.stats.itemCount}</div><div className="stat-lbl">Items</div>
        </div>
        <div style={{ padding: '11px 14px', borderRight: '1px solid var(--border)' }}>
          <div className="stat-num">{r.stats.trackingCount}</div><div className="stat-lbl">Trackings</div>
        </div>
        <div style={{ padding: '11px 14px' }}>
          <div className="stat-num">{r.stats.memberCount}</div><div className="stat-lbl">Team</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
        <span className="muted-2" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="clock" size={14} />
          {r.stats.lastTrackingMs ? `Last count ${relTime(r.stats.lastTrackingMs)}` : 'No counts yet'}
        </span>
        <button className="btn btn--ghost btn--sm" onClick={onEdit}><Icon name="edit" size={15} /> Edit</button>
      </div>
    </div>
  );
}

export function Restaurants({
  header, restaurants, onOpen, onAddRestaurant, onUpdateRestaurant,
}: {
  header?: ReactNode;
  restaurants: RestaurantStatVM[];
  onOpen: (id: string) => void;
  onAddRestaurant: (input: { name: string; city: string }) => void;
  onUpdateRestaurant: (id: string, input: { name: string; city: string }) => void;
}) {
  const [sheet, setSheet] = useState<{ restaurant: RestaurantStatVM | null } | null>(null);

  return (
    <div className="it-app screen">
      {header ?? <div className="appbar"><div className="appbar__title">Restaurants</div></div>}
      <div className="scroll">
        <div className="pad stack" style={{ gap: 13 }}>
          <div className="t-sm muted" style={{ padding: '0 2px', lineHeight: 1.5 }}>
            {restaurants.length} restaurant{restaurants.length === 1 ? '' : 's'} under your account. Open one to manage its catalog and team.
          </div>

          {restaurants.map((r) => (
            <RestaurantCard key={r.id} r={r} onOpen={() => onOpen(r.id)} onEdit={() => setSheet({ restaurant: r })} />
          ))}

          <Button variant="secondary" block icon="plus" onClick={() => setSheet({ restaurant: null })}>Add restaurant</Button>
          <div className="content-pad-bottom" />
        </div>
      </div>

      {sheet && (
        <RestaurantSheet
          restaurant={sheet.restaurant}
          onSave={(input) => {
            if (sheet.restaurant) onUpdateRestaurant(sheet.restaurant.id, input);
            else onAddRestaurant(input);
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}
