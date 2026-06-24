// guards.tsx — route protection (step 04). Reads auth state from the Redux store
// you build. Routing glue — generated for you; you don't need to touch it.
// NOTE: adjust the hooks import to wherever your typed hooks live (the guide
// puts them at src/lib/hooks.ts).
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../lib/hooks';
import type { Role } from '../../pages/Login';

export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAppSelector((s) => s.auth.status);
  if (status === 'loading') return null;              // wait out the first auth resolution
  return status === 'in' ? <>{children}</> : <Navigate to="/login" replace />;
}

export function RequireRole({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const role = useAppSelector((s) => s.auth.role);
  return role && allow.includes(role) ? <>{children}</> : <Navigate to="/" replace />;
}

// Requires a current restaurant (currentId). The per-restaurant screens are
// pointless without one, so send the user to the picker until they choose.
export function RequireRestaurant({ children }: { children: ReactNode }) {
  const currentId = useAppSelector((s) => s.restaurants.currentId);
  return currentId ? <>{children}</> : <Navigate to="/select" replace />;
}

// Where "/" sends an authenticated user, by role. No role yet (e.g. just
// registered, awaiting an admin's grant) → the pending-access screen.
export function RoleLanding() {
  const role = useAppSelector((s) => s.auth.role);
  if (!role) return <Navigate to="/pending" replace />;
  return <Navigate to={role === 'admin' ? '/restaurants' : '/home'} replace />;
}
