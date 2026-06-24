import { Navigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAppSelector } from '../../lib/hooks';
import { PendingAccess } from '../../pages/PendingAccess';

// Holding screen for a signed-in user with no role yet (e.g. just registered).
// Once an admin grants a role, this redirects into the app.
export function PendingContainer() {
  const role = useAppSelector((s) => s.auth.role);
  const name = useAppSelector((s) => s.auth.user?.name || undefined);
  if (role) return <Navigate to="/" replace />;
  return <PendingAccess userName={name} onSignOut={() => void signOut(auth)} />;
}
