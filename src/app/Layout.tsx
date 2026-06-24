// Layout.tsx — role-aware shell frame (sits under RequireAuth in the route table).
// Renders the generated AppFrame + the role's TabBar and an <Outlet> for the
// active screen's container. Each screen's container builds its own AppHeader
// (with the RestaurantSwitcher + AccountMenu) — see steps 07–11.
// Routing glue — generated for you. Adjust the hooks import to your typed hooks.
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppFrame, TabBar } from '../ui/shell';
import { useAppSelector } from '../lib/hooks';

export function Layout() {
  const role = useAppSelector((s) => s.auth.role);
  const loc = useLocation();
  const nav = useNavigate();
  // Signed in but no role yet (e.g. just registered) → the pending-access screen,
  // which lives outside this shell. (Also narrows role for the JSX below.)
  if (!role) return <Navigate to="/pending" replace />;

  const seg = loc.pathname.split('/')[1] || (role === 'admin' ? 'restaurants' : 'home');
  const isFlow = loc.pathname.startsWith('/track'); // tracking flow runs full-screen
  const tabBar = isFlow ? undefined : (
    <TabBar
      variant={role === 'admin' ? 'admin' : 'staff'}
      active={seg}
      onNavigate={(r) => nav(`/${r}`)}
      onNewTracking={() => nav('/track/new')}
    />
  );

  return (
    <AppFrame tabBar={tabBar}>
      <Outlet />
    </AppFrame>
  );
}
