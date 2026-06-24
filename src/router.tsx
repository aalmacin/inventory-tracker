// router.tsx — the route table. Login sits OUTSIDE the Layout; staff and admin
// routes hang off it, each wrapped in a role guard (step 04). Routing is
// generated for you — you fill in the imported containers + auth + store.
//
// What YOU still write for this to compile and run:
//   • ./app/store + your typed hooks (lib/hooks)        — step 05
//   • ./features/auth/AuthProvider + the auth slice      — step 04
//   • ./features/auth/LoginContainer                     — step 04
//   • the 8 screen containers below                      — steps 07–11
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './app/Layout';
import { RequireAuth, RequireRole, RequireRestaurant, RoleLanding } from './features/auth/guards';
import { LoginContainer } from './features/auth/LoginContainer';
import { RegisterContainer } from './features/auth/RegisterContainer';
import { PendingContainer } from './features/auth/PendingContainer';
import { RestaurantSelectContainer } from './features/restaurants/RestaurantSelectContainer';
import { HomeContainer } from './features/home/HomeContainer';
import { ReadOnlyItemsContainer } from './features/catalog/ReadOnlyItemsContainer';
import { ReportsContainer } from './features/reports/ReportsContainer';
import { TrackingContainer } from './features/trackings/TrackingContainer';
import { TrackingDetailContainer } from './features/trackings/TrackingDetailContainer';
import { RestaurantsContainer } from './features/restaurants/RestaurantsContainer';
import { CatalogContainer } from './features/catalog/CatalogContainer';
import { TeamContainer } from './features/team/TeamContainer';
import type { Role } from './pages/Login';

const STAFF: Role[] = ['manager', 'supervisor'];
const ADMIN: Role[] = ['admin'];

export const router = createBrowserRouter([
  // login + registration are outside the shell (no chrome, no guard)
  { path: '/login', element: <LoginContainer /> },
  { path: '/register', element: <RegisterContainer /> },
  // signed in but no role yet (just registered, awaiting an admin's grant)
  { path: '/pending', element: <RequireAuth><PendingContainer /></RequireAuth> },
  // restaurant picker — signed in, but no restaurant chosen yet (no chrome)
  { path: '/select', element: <RequireAuth><RestaurantSelectContainer /></RequireAuth> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <RoleLanding /> },

      // ── staff routes (manager / supervisor) — all need a current restaurant ──
      { path: 'home', element: <RequireRole allow={STAFF}><RequireRestaurant><HomeContainer /></RequireRestaurant></RequireRole> },
      { path: 'items', element: <RequireRole allow={STAFF}><RequireRestaurant><ReadOnlyItemsContainer /></RequireRestaurant></RequireRole> },
      { path: 'reports', element: <RequireRole allow={STAFF}><RequireRestaurant><ReportsContainer /></RequireRestaurant></RequireRole> },
      { path: 'track/new', element: <RequireRole allow={STAFF}><RequireRestaurant><TrackingContainer /></RequireRestaurant></RequireRole> },
      { path: 'track/:id/edit', element: <RequireRole allow={STAFF}><RequireRestaurant><TrackingContainer /></RequireRestaurant></RequireRole> },
      { path: 'track/:id', element: <RequireRole allow={STAFF}><RequireRestaurant><TrackingDetailContainer /></RequireRestaurant></RequireRole> },

      // ── admin routes ──
      // /restaurants is the admin's overview + picker; /catalog shows the picker
      // inline (in CatalogContainer) when no restaurant is chosen, so it isn't
      // wrapped in RequireRestaurant; /team still requires one (redirects to /select).
      { path: 'restaurants', element: <RequireRole allow={ADMIN}><RestaurantsContainer /></RequireRole> },
      { path: 'catalog', element: <RequireRole allow={ADMIN}><CatalogContainer /></RequireRole> },
      { path: 'team', element: <RequireRole allow={ADMIN}><RequireRestaurant><TeamContainer /></RequireRestaurant></RequireRole> },
    ],
  },
]);
