// Firestore for trackings — YOU implement these.
// Data lives in restaurants/{rid}/trackings. The walk hands you component Lines
// (per-unit breakdowns); round each unit value and keep only the non-empty
// inv/ord breakdowns before writing.
import type { AppDispatch } from '../../app/store';
import type { Lines } from '../../pages/Tracking';
import type { DeliveryCheck, Tracking, TrackingLine } from './types';
import { UNITS, hasQty, type UnitQty } from '../../lib/units';
import { trackingsReceived } from './trackingsSlice';
import { addDoc, collection, deleteDoc, deleteField, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { roundQty } from '../../lib/quantity';

// Fractions are entered in the UI but persisted as rounded decimals (0.75, not 0.7533).
const roundQtyBreakdown = (q: UnitQty | undefined): UnitQty => {
  const out: UnitQty = {};
  for (const u of UNITS) if (q?.[u] != null) out[u] = roundQty(q[u]!);
  return out;
};

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
    Object.entries(lines)
      .map(([id, l]): [string, TrackingLine] => {
        const out: TrackingLine = {};
        const inv = roundQtyBreakdown(l.inv);
        const ord = roundQtyBreakdown(l.ord);
        if (hasQty(inv)) out.inv = inv;
        if (hasQty(ord)) out.ord = ord;
        return [id, out];
      })
      .filter(([, l]) => hasQty(l.inv) || hasQty(l.ord)),
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
  [`lines.${itemId}.dlv`]:
    dlv === null
      ? deleteField()
      : {
          ok: dlv.ok,
          ...(dlv.note != null ? { note: dlv.note } : {}),
          ...(dlv.arrived !== undefined ? { arrived: roundQtyBreakdown(dlv.arrived) } : {}),
        },
});

export const deleteTracking = (rid: string, id: string): Promise<void> =>
  deleteDoc(doc(trackingsCol(rid), id));
