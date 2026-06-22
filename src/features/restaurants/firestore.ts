// Firestore for restaurants — YOU implement these.
// restaurants/{rid} is top-level. Stats use getCountFromServer per restaurant.
import type { AppDispatch } from '../../app/store';
// import { restaurantsReceived } from './restaurantsSlice';

export interface RestaurantStats {
  itemCount: number;
  trackingCount: number;
  memberCount: number;
  lastTrackingMs: number | null;
}

const todo = (name: string): never => {
  throw new Error(`TODO: implement restaurants.${name} with Firestore`);
};

// Subscribe to all restaurants; returns unsubscribe.
export function subscribeRestaurants(dispatch: AppDispatch): () => void {
  // TODO: onSnapshot(collection(db, 'restaurants')) -> dispatch(restaurantsReceived(...))
  void dispatch;
  return () => {};
}

export const addRestaurant = (input: { name: string; city: string }): Promise<void> =>
  (void input, todo('addRestaurant'));

export const updateRestaurant = (id: string, input: { name: string; city: string }): Promise<void> =>
  (void id, void input, todo('updateRestaurant'));

// per-restaurant counts (getCountFromServer) + last tracking date
export const restaurantStats = (rid: string): Promise<RestaurantStats> =>
  (void rid, todo('restaurantStats'));
