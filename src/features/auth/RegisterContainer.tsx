import { Navigate, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useAppSelector } from '../../lib/hooks';
import { Register } from '../../pages/Register';

// Creates a Firebase Auth account (no claims yet) and records a pending access
// request an admin can grant later. After sign-up the user is signed in with
// role === null, so RoleLanding sends them to the pending-access screen.
export function RegisterContainer() {
  const nav = useNavigate();
  const status = useAppSelector((s) => s.auth.status);
  if (status === 'in') return <Navigate to="/" replace />;

  const signUp = async (name: string, email: string, password: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      // A pending request the admin can see/grant later (the user has no role yet,
      // so it goes in accessRequests, not the typed members collection).
      await setDoc(doc(db, 'accessRequests', cred.user.uid), {
        name,
        email,
        status: 'pending',
        createdAt: Date.now(),
      });
      nav('/', { replace: true });
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'auth/email-already-in-use') throw new Error('That email is already registered — try signing in.');
      if (code === 'auth/invalid-email') throw new Error('That email address is invalid.');
      if (code === 'auth/weak-password') throw new Error('Password is too weak (use at least 6 characters).');
      throw new Error('Sign-up failed. Please try again.');
    }
  };

  return <Register onSubmit={signUp} onBackToLogin={() => nav('/login')} />;
}
