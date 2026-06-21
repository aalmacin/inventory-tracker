// shell.tsx — app chrome, PRESENTATIONAL ONLY: RestaurantSwitcher, AccountMenu,
// AppHeader (switcher row + title row), TabBar (staff/admin), AppFrame (layout).
//
// THE SEAM: these take data + callbacks via props. Your container/Layout reads
// the current user, role, and restaurants from Redux and passes them in, and
// implements onSwitch / onSignOut / onNavigate as your routing + Firestore.
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export type Role = 'admin' | 'manager' | 'supervisor';
const ROLE_LABEL: Record<Role, string> = { admin: 'Admin', manager: 'Manager', supervisor: 'Supervisor' };

export interface RestaurantVM { id: string; name: string; city: string; initials: string; tint: string; }
export interface UserVM { name: string; email: string; role: Role; }

function initials(name: string) {
  return (name || '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// ── Restaurant switcher (top-bar chip + dropdown) ────────────
export function RestaurantSwitcher({
  restaurants, currentId, onSwitch,
}: {
  restaurants: RestaurantVM[];
  currentId: string | null;
  onSwitch: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = restaurants.find((r) => r.id === currentId);
  const multi = restaurants.length > 1;
  if (!current) return <div />;

  return (
    <div style={{ position: 'relative', minWidth: 0 }}>
      <button
        className={`rest-chip ${multi ? 'rest-chip--btn' : ''}`}
        onClick={() => multi && setOpen((o) => !o)}
        aria-label="switch restaurant"
        disabled={!multi}
      >
        <span className="rest-chip__avatar" style={{ background: current.tint }}>{current.initials}</span>
        <span className="rest-chip__text">
          <span className="rest-chip__name">{current.name}</span>
          <span className="rest-chip__sub">{multi ? 'Switch restaurant' : current.city}</span>
        </span>
        {multi && <span className="rest-chip__chev"><Icon name="chevD" size={15} /></span>}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setOpen(false)} />
          <div className="rest-menu">
            <div className="rest-menu__head">Your restaurants</div>
            {restaurants.map((r) => {
              const active = r.id === current.id;
              return (
                <button key={r.id} className={`rest-menu__opt ${active ? 'is-active' : ''}`} onClick={() => { onSwitch(r.id); setOpen(false); }}>
                  <span className="rest-chip__avatar" style={{ background: r.tint }}>{r.initials}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="rest-menu__name">{r.name}</span>
                    <span className="rest-menu__city">{r.city}</span>
                  </span>
                  {active && <span style={{ color: 'var(--accent-text)' }}><Icon name="check" size={18} strokeWidth={2.4} /></span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Account button + menu ────────────────────────────────────
export function AccountMenu({
  user, restaurantCount, onSignOut,
}: {
  user: UserVM;
  restaurantCount: number;
  onSignOut: () => void;
}) {
  const [menu, setMenu] = useState(false);
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button className="icon-btn" onClick={() => setMenu((m) => !m)} aria-label="account">
        <div className="acct-avatar">{initials(user.name)}</div>
      </button>
      {menu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setMenu(false)} />
          <div style={{ position: 'absolute', top: 44, right: 0, width: 240, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-pop)', zIndex: 31, overflow: 'hidden' }}>
            <div style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span className="t-sm fw-7">{user.name}</span>
                <span className={`role-tag role-tag--${user.role}`}>{ROLE_LABEL[user.role]}</span>
              </div>
              <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{user.email}</div>
              <div className="muted-2" style={{ fontSize: 11.5, marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon name="store" size={13} />
                {user.role === 'admin' ? 'All restaurants' : `${restaurantCount} restaurant${restaurantCount === 1 ? '' : 's'}`}
              </div>
            </div>
            <button className="row" style={{ color: 'var(--out)' }} onClick={onSignOut}>
              <Icon name="signout" size={18} />
              <span className="fw-6 t-sm">Sign out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── App header (switcher row + title row) ────────────────────
export function AppHeader({
  title, sub, trailing, switcher, account,
}: {
  title: string;
  sub?: string;
  trailing?: ReactNode;
  switcher?: ReactNode;   // pass <RestaurantSwitcher .../> (omit for admin Restaurants screen)
  account?: ReactNode;    // pass <AccountMenu .../>
}) {
  return (
    <div className="appbar" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        {switcher ?? <div style={{ minWidth: 0 }} />}
        {account}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          {sub && <div className="eyebrow" style={{ marginBottom: 3 }}>{sub}</div>}
          <div className="appbar__title">{title}</div>
        </div>
        {trailing}
      </div>
    </div>
  );
}

// ── Tab bars ─────────────────────────────────────────────────
const STAFF_TABS: { route: string; icon: IconName; label: string }[] = [
  { route: 'home', icon: 'home', label: 'Home' },
  { route: 'items', icon: 'items', label: 'Items' },
];
const ADMIN_TABS: { route: string; icon: IconName; label: string }[] = [
  { route: 'restaurants', icon: 'store', label: 'Restaurants' },
  { route: 'catalog', icon: 'folder', label: 'Catalog' },
  { route: 'team', icon: 'users', label: 'Team' },
];

export function TabBar({
  variant, active, onNavigate, onNewTracking,
}: {
  variant: 'staff' | 'admin';
  active: string;
  onNavigate: (route: string) => void;
  onNewTracking?: () => void;   // staff only — the center FAB
}) {
  if (variant === 'admin') {
    return (
      <div className="tabbar tabbar--admin" style={{ paddingBottom: 'var(--safe-bottom)' }}>
        {ADMIN_TABS.map((t) => (
          <button key={t.route} className={`tab ${active === t.route ? 'tab--active' : ''}`} onClick={() => onNavigate(t.route)}>
            <Icon name={t.icon} size={23} strokeWidth={active === t.route ? 2 : 1.75} />
            <span className="tab__label">{t.label}</span>
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="tabbar" style={{ paddingBottom: 'var(--safe-bottom)' }}>
      <button className={`tab ${active === 'home' ? 'tab--active' : ''}`} onClick={() => onNavigate('home')}>
        <Icon name="home" size={23} strokeWidth={active === 'home' ? 2 : 1.75} />
        <span className="tab__label">Home</span>
      </button>
      <button className="tab tab--fab" onClick={onNewTracking}>
        <div className="tab__fab"><Icon name="plus" size={26} /></div>
      </button>
      <button className={`tab ${active === 'items' ? 'tab--active' : ''}`} onClick={() => onNavigate('items')}>
        <Icon name="items" size={23} strokeWidth={active === 'items' ? 2 : 1.75} />
        <span className="tab__label">Items</span>
      </button>
    </div>
  );
}

// ── App frame (phone-style column: content fills, tab bar pinned) ──
export function AppFrame({ children, tabBar }: { children: ReactNode; tabBar?: ReactNode }) {
  return (
    <div className="it-app" style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>{children}</div>
      {tabBar}
    </div>
  );
}
// reference STAFF_TABS so it isn't flagged unused if you tree-shake the staff bar
void STAFF_TABS;
