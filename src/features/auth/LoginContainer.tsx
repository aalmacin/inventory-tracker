import { Navigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAppSelector } from '../../lib/hooks';
import { Login, type Persona } from '../../pages/Login';

// The role picker signs into a seeded demo account per persona. The accounts
// (and their role/restaurantIds claims) are part of your Firebase Auth setup —
// seed them in the Auth emulator. Swap this for a real email/password form later.
const DEMO_PASSWORD = 'kitchen';

export function LoginContainer() {
  const status = useAppSelector((s) => s.auth.status);
  if (status === 'in') return <Navigate to="/" replace />;

  const signIn = (p: Persona) =>
    signInWithEmailAndPassword(auth, `${p.key}@riverside.co`, DEMO_PASSWORD).catch(() => {
      alert('Sign-in failed — seed this account in the Auth emulator with its role claim.');
    });

  return <Login onPick={signIn} />;
}
