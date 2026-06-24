import { Navigate, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAppSelector } from '../../lib/hooks';
import { Login } from '../../pages/Login';

// Email/password sign-in against Firebase Auth. To try a role in dev, sign in
// with a seeded account (`yarn seed`) — e.g. admin@riverside.co / kitchen. The
// demo-account quick-fill is shown only in development; production gets the bare
// login form.
export function LoginContainer() {
  const nav = useNavigate();
  const status = useAppSelector((s) => s.auth.status);
  if (status === 'in') return <Navigate to="/" replace />;

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      throw new Error('Wrong email or password.');
    }
  };

  return <Login onSubmit={signIn} onRegister={() => nav('/register')} showDemo={import.meta.env.DEV} />;
}
