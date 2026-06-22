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

// Where "/" sends an authenticated user, by role.
export function RoleLanding() {
  const role = useAppSelector((s) => s.auth.role);
  return <Navigate to={role === 'admin' ? '/restaurants' : '/home'} replace />;
}
