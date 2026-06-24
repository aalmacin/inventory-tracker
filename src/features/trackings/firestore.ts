// Firestore for trackings — YOU implement these.
// Data lives in restaurants/{rid}/trackings. The walk hands you component Lines
// ('' / null markers); convert to { inv, ord } (null for empty) before writing.
import type { AppDispatch } from '../../app/store';
import type { Lines } from '../../pages/Tracking';
import type { DeliveryCheck, Tracking, TrackingLine } from './types';
import { trackingsReceived } from './trackingsSlice';
import { addDoc, collection, deleteDoc, deleteField, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const trackingsCol = (rid: string) => collection(db, 'restaurants', rid, 'trackings');

// Subscribe to this restaurant's trackings (orderBy date desc); returns unsubscribe.
export function subscribeTrackings(rid: string, dispatch: AppDispatch): () => void {
  return onSnapshot(
    query(trackingsCol(rid), orderBy('date', 'desc')),
    snap => {
      const list: Tracking[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Tracking, 'id'>) }));
      dispatch(trackingsReceived(list));
    }
  );
}

const toStored = (lines: Lines): Record<string, TrackingLine> =>
  Object.fromEntries(
    Object.entries(lines).map(([id, l]) => [
      id,
      { inv: l.inv === '' || l.inv === undefined ? null : l.inv, ord: l.ord ?? null },
    ]),
  );

// returns the new tracking id (for navigation to its detail)
export const createTracking = async (
  rid: string,
  by: string,
  out: { lines: Lines; note: string; dateMs: number },
): Promise<string> => {
  const ref = await addDoc(trackingsCol(rid), {
    date: out.dateMs,
    by,
    note: out.note,
    lines: toStored(out.lines),
  });
  return ref.id;
}

export const updateTracking = (
  rid: string,
  id: string,
  out: { lines: Lines; note: string; dateMs: number },
): Promise<void> => updateDoc(doc(trackingsCol(rid), id), {
  date: out.dateMs,
  note: out.note,
  lines: toStored(out.lines),
});

// nested write of one line's dlv (use a field path; deleteField() to clear)
export const setDelivery = (
  rid: string,
  trackingId: string,
  itemId: string,
  dlv: DeliveryCheck | null,
): Promise<void> => updateDoc(doc(trackingsCol(rid), trackingId), {
  [`lines.${itemId}.dlv`]: dlv === null ? deleteField() : dlv,
});

export const deleteTracking = (rid: string, id: string): Promise<void> =>
  deleteDoc(doc(trackingsCol(rid), id));
