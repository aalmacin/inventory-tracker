// App.tsx — runnable DEMO router + role-aware shell. Wires the generated screens
// to the local demo store so you can click through the app now. Replace the
// route containers + demo store with your Redux/Firestore containers when ready.
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation, useNavigate, useParams } from 'react-router-dom';
import { DemoProvider, useDemo, type DeliveryCheck, type TrackingLine } from './app/demo';
import { Login } from './pages/Login';
import { Home, type DeliveryStatus } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { Items } from './pages/Items';
import { Tracking, type Lines } from './pages/Tracking';
import { TrackingDetail } from './pages/TrackingDetail';
import { Reports } from './pages/Reports';
import { Restaurants } from './pages/Restaurants';
import { Team } from './pages/Team';
import { AppFrame, AppHeader, RestaurantSwitcher, AccountMenu, TabBar } from './ui/shell';

const has = (v: unknown): v is number => v !== undefined && v !== null;

// ── chrome (switcher + account) built from the demo store ────
function useChrome() {
  const { myRestaurants, currentId, setCurrentRestaurant, user, signOut } = useDemo();
  return {
    switcher: <RestaurantSwitcher restaurants={myRestaurants} currentId={currentId} onSwitch={setCurrentRestaurant} />,
    account: user ? <AccountMenu user={{ name: user.name, email: user.email, role: user.role }} restaurantCount={myRestaurants.length} onSignOut={signOut} /> : null,
  };
}

// ── lines conversions (component '' / null markers <-> store) ─
const fromComponentLines = (l: Lines): Record<string, TrackingLine> => {
  const out: Record<string, TrackingLine> = {};
  for (const [id, v] of Object.entries(l)) {
    const inv = v.inv === '' || v.inv === undefined ? null : v.inv;
    const ord = v.ord === undefined ? null : v.ord;
    if (inv !== null || ord !== null) out[id] = { inv, ord };
  }
  return out;
};
const toComponentLines = (l: Record<string, TrackingLine>): Lines => {
  const out: Lines = {};
  for (const [id, v] of Object.entries(l)) out[id] = { inv: v.inv === null ? undefined : v.inv, ord: v.ord };
  return out;
};

function deliveryStatus(lines: Record<string, TrackingLine>): DeliveryStatus {
  const ordered = Object.values(lines).filter((l) => has(l.ord));
  if (!ordered.length) return { kind: 'none' };
  const open = ordered.filter((l) => !l.dlv).length;
  return open === 0 ? { kind: 'done' } : { kind: 'pending', open, total: ordered.length };
}

// ── route containers ─────────────────────────────────────────
function HomeRoute() {
  const s = useDemo(); const nav = useNavigate(); const c = useChrome();
  const restaurantName = s.restaurants.find((r) => r.id === s.currentId)?.name ?? '';
  return (
    <Home
      header={<AppHeader title="Inventory" sub={restaurantName} switcher={c.switcher} account={c.account} />}
      trackings={s.trackings.map((t) => ({ id: t.id, date: t.date, note: t.note, delivery: deliveryStatus(t.lines) }))}
      itemCount={s.items.filter((i) => !i.disabled).length}
      onNewTracking={() => nav('/track/new')}
      onOpenTracking={(id) => nav(`/track/${id}`)}
      onBrowseItems={() => nav('/items')}
    />
  );
}

function CatalogRoute() {
  const s = useDemo();
  const restaurantName = s.restaurants.find((r) => r.id === s.currentId)?.name ?? '';
  const categories = s.categories.map((cat) => ({
    id: cat.id, label: cat.label,
    items: s.items.filter((i) => i.category === cat.id).map((i) => ({ id: i.id, name: i.name, unit: i.unit, disabled: i.disabled })),
  }));
  return (
    <Catalog
      restaurantName={restaurantName} categories={categories}
      onAddCategory={s.addCategory} onRenameCategory={s.renameCategory} onDeleteCategory={s.deleteCategory} onMoveCategory={s.moveCategory}
      onAddItem={s.addItem} onUpdateItem={s.updateItem} onDeleteItem={s.deleteItem} onToggleItem={s.setItemActive}
    />
  );
}

function ItemsRoute() {
  const s = useDemo();
  const restaurantName = s.restaurants.find((r) => r.id === s.currentId)?.name ?? '';
  const categories = s.categories.map((cat) => ({
    id: cat.id, label: cat.label,
    items: s.items.filter((i) => i.category === cat.id && !i.disabled).map((i) => ({ id: i.id, name: i.name })),
  }));
  return <Items restaurantName={restaurantName} categories={categories} />;
}

function makeRecent(trackings: { lines: Record<string, TrackingLine> }[], field: 'inv' | 'ord') {
  return (itemId: string): number[] => {
    const seen = new Set<number>(); const out: number[] = [];
    for (const t of trackings) {
      const v = t.lines[itemId]?.[field];
      if (v === null || v === undefined || seen.has(v)) continue;
      seen.add(v); out.push(v);
      if (out.length >= 6) break;
    }
    return out;
  };
}

function activeCategories(s: ReturnType<typeof useDemo>) {
  return s.categories.map((cat) => ({
    id: cat.id, label: cat.label,
    items: s.items.filter((i) => i.category === cat.id && !i.disabled).map((i) => ({ id: i.id, name: i.name, unit: i.unit })),
  })).filter((cat) => cat.items.length);
}

function TrackingNewRoute() {
  const s = useDemo(); const nav = useNavigate();
  return (
    <Tracking
      mode="new" categories={activeCategories(s)}
      recentInv={makeRecent(s.trackings, 'inv')} recentOrd={makeRecent(s.trackings, 'ord')}
      onSave={(out) => { const id = s.addTracking({ lines: fromComponentLines(out.lines), note: out.note, dateMs: out.dateMs }); nav(`/track/${id}`); }}
      onCancel={() => nav('/home')}
    />
  );
}

function TrackingEditRoute() {
  const s = useDemo(); const nav = useNavigate(); const { id = '' } = useParams();
  const existing = s.trackingById(id);
  if (!existing) return <Navigate to="/home" replace />;
  return (
    <Tracking
      mode="edit" categories={activeCategories(s)}
      initialLines={toComponentLines(existing.lines)} initialNote={existing.note} initialDateMs={existing.date}
      recentInv={makeRecent(s.trackings, 'inv')} recentOrd={makeRecent(s.trackings, 'ord')}
      onSave={(out) => { s.updateTracking(id, { lines: fromComponentLines(out.lines), note: out.note, dateMs: out.dateMs }); nav(`/track/${id}`); }}
      onCancel={() => nav(`/track/${id}`)}
    />
  );
}

function TrackingDetailRoute() {
  const s = useDemo(); const nav = useNavigate(); const { id = '' } = useParams();
  const t = s.trackingById(id);
  if (!t) return <Navigate to="/home" replace />;
  const categories = s.categories.map((cat) => ({
    id: cat.id, label: cat.label,
    rows: s.items.filter((i) => i.category === cat.id)
      .map((i) => ({ i, line: t.lines[i.id] }))
      .filter((r) => r.line && (has(r.line.inv) || has(r.line.ord)))
      .map((r) => ({ itemId: r.i.id, name: r.i.name, unit: r.i.unit, inv: r.line.inv, ord: r.line.ord, dlv: r.line.dlv })),
  })).filter((cat) => cat.rows.length);
  return (
    <TrackingDetail
      tracking={{ id: t.id, dateMs: t.date, by: t.by, note: t.note, categories }}
      onSetDelivery={(itemId, dlv: DeliveryCheck | null) => s.setDelivery(id, itemId, dlv)}
      onEdit={() => nav(`/track/${id}/edit`)}
      onDelete={() => { s.deleteTracking(id); nav('/home'); }}
    />
  );
}

function ReportsRoute() {
  const s = useDemo(); const nav = useNavigate(); const c = useChrome();
  const categories = s.categories.map((cat) => ({
    id: cat.id, label: cat.label,
    items: s.items.filter((i) => i.category === cat.id && !i.disabled).map((i) => ({ id: i.id, name: i.name })),
  }));
  const trackings = s.trackings.map((t) => ({ id: t.id, dateMs: t.date, lines: t.lines }));
  return <Reports header={<AppHeader title="Reports" sub="Stockroom" switcher={c.switcher} account={c.account} />} categories={categories} trackings={trackings} onOpenTracking={(id) => nav(`/track/${id}`)} />;
}

function RestaurantsRoute() {
  const s = useDemo(); const nav = useNavigate(); const c = useChrome();
  const restaurants = s.restaurants.map((r) => ({ ...r, isCurrent: r.id === s.currentId, stats: s.restStats(r.id) }));
  return (
    <Restaurants
      header={<AppHeader title="Restaurants" account={c.account} />}
      restaurants={restaurants}
      onOpen={(id) => { s.setCurrentRestaurant(id); nav('/catalog'); }}
      onAddRestaurant={s.addRestaurant} onUpdateRestaurant={s.updateRestaurant}
    />
  );
}

function TeamRoute() {
  const s = useDemo(); const c = useChrome();
  const current = s.restaurants.find((r) => r.id === s.currentId) ?? null;
  return (
    <Team
      header={<AppHeader title="Team" switcher={c.switcher} account={c.account} />}
      members={s.members} restaurants={s.restaurants}
      currentRestaurant={current ? { id: current.id, name: current.name, initials: current.initials } : null}
      onInvite={s.inviteMember} onUpdateMember={s.updateMember} onRemoveMember={s.removeMember} onResend={s.resendInvite}
    />
  );
}

function LoginRoute() {
  const { signIn } = useDemo();
  return <Login onPick={(p) => signIn(p.role)} />;
}

function RoleLanding() {
  const { user } = useDemo();
  return <Navigate to={user?.role === 'admin' ? '/restaurants' : '/home'} replace />;
}

// ── layout: login gate + shell + role tab bar ────────────────
function Layout() {
  const { user } = useDemo();
  const role = user?.role;
  const loc = useLocation(); const nav = useNavigate();
  if (!user || !role) return <LoginRoute />;
  const seg = loc.pathname.split('/')[1] || (role === 'admin' ? 'restaurants' : 'home');
  const isFlow = loc.pathname.startsWith('/track');
  const tabBar = isFlow ? undefined : (
    <TabBar variant={role === 'admin' ? 'admin' : 'staff'} active={seg} onNavigate={(r) => nav(`/${r}`)} onNewTracking={() => nav('/track/new')} />
  );
  return <AppFrame tabBar={tabBar}><Outlet /></AppFrame>;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <RoleLanding /> },
      { path: 'home', element: <HomeRoute /> },
      { path: 'items', element: <ItemsRoute /> },
      { path: 'reports', element: <ReportsRoute /> },
      { path: 'track/new', element: <TrackingNewRoute /> },
      { path: 'track/:id/edit', element: <TrackingEditRoute /> },
      { path: 'track/:id', element: <TrackingDetailRoute /> },
      { path: 'restaurants', element: <RestaurantsRoute /> },
      { path: 'catalog', element: <CatalogRoute /> },
      { path: 'team', element: <TeamRoute /> },
    ],
  },
]);

export default function App() {
  return (
    <DemoProvider>
      <RouterProvider router={router} />
    </DemoProvider>
  );
}
