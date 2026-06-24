import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../lib/hooks';
import { subscribeRestaurants } from '../features/restaurants/firestore';
import { subscribeMembers } from '../features/team/firestore';
import { subscribeCatalog } from '../features/catalog/firestore';
import { subscribeTrackings } from '../features/trackings/firestore';
import { catalogCleared } from '../features/catalog/catalogSlice';
import { trackingsCleared } from '../features/trackings/trackingsSlice';

// Starts the Firestore listeners: restaurants + members globally (while signed
// in), and catalog + trackings scoped to the current restaurant. The current
// restaurant is chosen explicitly on the picker (/select) — it is no longer
// auto-defaulted, so the per-restaurant screens stay empty until one is picked.
// Call once, inside the shell.
export function useFirestoreSync() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);
  const currentId = useAppSelector((s) => s.restaurants.currentId);

  useEffect(() => {
    if (status !== 'in') return;
    const unsubs = [subscribeRestaurants(dispatch), subscribeMembers(dispatch)];
    return () => unsubs.forEach((u) => u());
  }, [status, dispatch]);

  useEffect(() => {
    if (!currentId) return;
    const unsubs = [subscribeCatalog(currentId, dispatch), subscribeTrackings(currentId, dispatch)];
    return () => {
      unsubs.forEach((u) => u());
      dispatch(catalogCleared());
      dispatch(trackingsCleared());
    };
  }, [currentId, dispatch]);
}
