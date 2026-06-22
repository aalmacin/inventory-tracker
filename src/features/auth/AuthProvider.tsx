import { useEffect, type ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAppDispatch } from '../../lib/hooks';
import { authChanged } from './authSlice';
import type { Role } from '../../pages/Login';

// Projects Firebase Auth (+ custom claims) into the auth slice. role and
// restaurantIds come from claims set server-side by the step-10 invite function.
export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        if (!u) {
          dispatch(authChanged({ user: null, role: null, restaurantIds: [], status: 'out' }));
          return;
        }
        const token = await u.getIdTokenResult();
        dispatch(
          authChanged({
            user: { uid: u.uid, name: u.displayName ?? '', email: u.email ?? '' },
            role: (token.claims.role as Role | undefined) ?? null,
            restaurantIds: (token.claims.restaurantIds as string[] | undefined) ?? [],
            status: 'in',
          }),
        );
      }),
    [dispatch],
  );

  return <>{children}</>;
}
