// RestaurantSelect.tsx — pick which restaurant to work in. PRESENTATIONAL ONLY.
//
// Shown when the user is signed in but no restaurant is selected (currentId is
// null). THE SEAM: the container passes the restaurants this user can access and
// onSelect (which sets currentId in Redux). onSignOut is optional.
import { Icon } from '../ui/Icon';

export interface SelectableRestaurant {
  id: string;
  name: string;
  city: string;
  initials: string;
  tint: string;
}

export function RestaurantSelect({
  restaurants,
  onSelect,
  userName,
  onSignOut,
}: {
  restaurants: SelectableRestaurant[];
  onSelect: (id: string) => void;
  userName?: string;
  onSignOut?: () => void;
}) {
  return (
    <div className="it-app screen" style={{ background: 'var(--surface)' }}>
      <div className="scroll" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: '0 0 auto', height: 40 }} />
        <div style={{ padding: '0 26px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 24 }}>
            <div className="eyebrow" style={{ marginBottom: 9 }}>{userName ? `Signed in as ${userName}` : 'Welcome'}</div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>Choose a restaurant</div>
            <div className="muted-2" style={{ fontSize: 14, marginTop: 5, lineHeight: 1.5 }}>
              Pick the location you want to work in. You can switch any time from the top bar.
            </div>
          </div>

          {restaurants.length === 0 ? (
            <div className="empty">
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--surface-3)', color: 'var(--ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="store" size={24} />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 600 }}>No restaurants yet</div>
                <div className="muted t-sm" style={{ marginTop: 4 }}>You don&rsquo;t have access to any restaurant. Ask an admin to add you to one.</div>
              </div>
            </div>
          ) : (
            <div className="stack" style={{ gap: 11 }}>
              {restaurants.map((r) => (
                <button key={r.id} className="role-card" style={{ alignItems: 'center' }} onClick={() => onSelect(r.id)}>
                  <span className="rest-chip__avatar" style={{ width: 46, height: 46, borderRadius: 13, fontSize: 15, background: r.tint }}>{r.initials}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="role-card__title" style={{ display: 'block' }}>{r.name}</span>
                    <span className="role-card__meta" style={{ marginTop: 5 }}><Icon name="store" size={13} /> {r.city}</span>
                  </span>
                  <span style={{ color: 'var(--ink-4)', display: 'flex' }}><Icon name="chevR" size={18} /></span>
                </button>
              ))}
            </div>
          )}

          <div style={{ flex: 1, minHeight: 24 }} />

          {onSignOut && (
            <div style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 12, paddingBottom: 28 }}>
              <button className="btn btn--ghost btn--sm" onClick={onSignOut}><Icon name="signout" size={15} /> Sign out</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
