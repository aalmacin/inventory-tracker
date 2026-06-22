import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../lib/hooks';
import { subscribeRestaurants } from '../features/restaurants/firestore';
import { subscribeMembers } from '../features/team/firestore';
import { subscribeCatalog } from '../features/catalog/firestore';
import { subscribeTrackings } from '../features/trackings/firestore';
import { currentRestaurantSet } from '../features/restaurants/restaurantsSlice';
import { catalogCleared } from '../features/catalog/catalogSlice';
import { trackingsCleared } from '../features/trackings/trackingsSlice';

// Starts the Firestore listeners: restaurants + members globally (while signed
// in), and catalog + trackings scoped to the current restaurant. Defaults the
// current restaurant once the list loads. Call once, inside the shell.
export function useFirestoreSync() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);
  const role = useAppSelector((s) => s.auth.role);
  const restaurantIds = useAppSelector((s) => s.auth.restaurantIds);
  const restaurants = useAppSelector((s) => s.restaurants.list);
  const currentId = useAppSelector((s) => s.restaurants.currentId);

  useEffect(() => {
    if (status !== 'in') return;
    const unsubs = [subscribeRestaurants(dispatch), subscribeMembers(dispatch)];
    return () => unsubs.forEach((u) => u());
  }, [status, dispatch]);

  useEffect(() => {
    if (currentId || !restaurants.length) return;
    const first = role === 'admin' ? restaurants[0]?.id : restaurants.find((r) => restaurantIds.includes(r.id))?.id;
    if (first) dispatch(currentRestaurantSet(first));
  }, [currentId, restaurants, role, restaurantIds, dispatch]);

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
