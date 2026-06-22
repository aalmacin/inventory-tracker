// Firestore for trackings — YOU implement these.
// Data lives in restaurants/{rid}/trackings. The walk hands you component Lines
// ('' / null markers); convert to { inv, ord } (null for empty) before writing.
import type { AppDispatch } from '../../app/store';
import type { Lines } from '../../pages/Tracking';
import type { DeliveryCheck } from './types';
// import { trackingsReceived } from './trackingsSlice';

const todo = (name: string): never => {
  throw new Error(`TODO: implement trackings.${name} with Firestore`);
};

// Subscribe to this restaurant's trackings (orderBy date desc); returns unsubscribe.
export function subscribeTrackings(rid: string, dispatch: AppDispatch): () => void {
  // TODO: onSnapshot(query(trackingsCol(rid), orderBy('date', 'desc'))) -> dispatch(trackingsReceived(...))
  void rid;
  void dispatch;
  return () => {};
}

// returns the new tracking id (for navigation to its detail)
export const createTracking = (
  rid: string,
  by: string,
  out: { lines: Lines; note: string; dateMs: number },
): Promise<string> => (void rid, void by, void out, todo('createTracking'));

export const updateTracking = (
  rid: string,
  id: string,
  out: { lines: Lines; note: string; dateMs: number },
): Promise<void> => (void rid, void id, void out, todo('updateTracking'));

// nested write of one line's dlv (use a field path; deleteField() to clear)
export const setDelivery = (
  rid: string,
  trackingId: string,
  itemId: string,
  dlv: DeliveryCheck | null,
): Promise<void> => (void rid, void trackingId, void itemId, void dlv, todo('setDelivery'));

export const deleteTracking = (rid: string, id: string): Promise<void> =>
  (void rid, void id, todo('deleteTracking'));
