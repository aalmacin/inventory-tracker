// Firestore for restaurants — YOU implement these.
// restaurants/{rid} is top-level. Stats use getCountFromServer per restaurant.
import { onSnapshot, collection, addDoc, doc, updateDoc, where, query, getCountFromServer, orderBy, limit, getDocs } from 'firebase/firestore';
import type { AppDispatch } from '../../app/store';
import { db } from '../../lib/firebase';
import { restaurantsReceived } from './restaurantsSlice';
import type { Restaurant } from './types';

export interface RestaurantStats {
  itemCount: number;
  trackingCount: number;
  memberCount: number;
  lastTrackingMs: number | null;
}

const restaurantsCol = collection(db, 'restaurants');

const initialsOf = (name: string): string => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

// Subscribe to all restaurants; returns unsubscribe.
export function subscribeRestaurants(dispatch: AppDispatch): () => void {
  return onSnapshot(restaurantsCol, snap => {
    const list: Restaurant[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Restaurant, 'id'>) }));
    dispatch(restaurantsReceived(list));
  });
}

export const addRestaurant = async (input: { name: string; city: string }): Promise<void> => {
  await addDoc(restaurantsCol,
    { name: input.name, city: input.city, initials: initialsOf(input.name), tint: 'teal' });
}

export const updateRestaurant = (id: string, input: { name: string; city: string }): Promise<void> =>
  updateDoc(doc(restaurantsCol, id), input);

// per-restaurant counts (getCountFromServer) + last tracking date
export const restaurantStats = async (rid: string): Promise<RestaurantStats> => {
  const items = collection(db, 'restaurants', rid, 'items');
  const trackings = collection(db, 'restaurants', rid, 'trackings');
  const members = query(collection(db, 'members'), where('restaurantIds', 'array-contains', rid));

  const [itemsCount, trackingsCount, membersCount, lastSnap] = await Promise.all([
    getCountFromServer(items),
    getCountFromServer(trackings),
    getCountFromServer(members),
    getDocs(query(trackings, orderBy('date', 'desc'), limit(1))),
  ])

  return {
    itemCount: itemsCount.data().count,
    trackingCount: trackingsCount.data().count,
    memberCount: membersCount.data().count,
    lastTrackingMs: lastSnap.empty ? null : (lastSnap.docs[0].data().date as number),
  }
}
