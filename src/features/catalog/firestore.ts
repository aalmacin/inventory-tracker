// Firestore for the catalog — YOU implement these (this is the learning part).
// Data lives in restaurants/{rid}/categories and restaurants/{rid}/items.
// Listeners push docs into the slice (categoriesReceived/itemsReceived); the
// write helpers below are called by CatalogContainer. Signatures are fixed —
// fill the bodies with addDoc/updateDoc/writeBatch/onSnapshot.
import type { AppDispatch } from '../../app/store';
import type { Unit } from './types';
// import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
// import { db } from '../../lib/firebase';
// import { categoriesReceived, itemsReceived } from './catalogSlice';

const todo = (name: string): never => {
  throw new Error(`TODO: implement catalog.${name} with Firestore`);
};

// Subscribe to this restaurant's categories + items; returns an unsubscribe.
export function subscribeCatalog(rid: string, dispatch: AppDispatch): () => void {
  // TODO: onSnapshot(query(categoriesCol(rid), orderBy('order'))) -> dispatch(categoriesReceived(...))
  // TODO: onSnapshot(itemsCol(rid)) -> dispatch(itemsReceived(...))
  void rid;
  void dispatch;
  return () => {};
}

export const addCategory = (rid: string, label: string, order: number): Promise<void> =>
  (void rid, void label, void order, todo('addCategory'));

export const renameCategory = (rid: string, id: string, label: string): Promise<void> =>
  (void rid, void id, void label, todo('renameCategory'));

// delete the category AND its items in one writeBatch
export const deleteCategory = (rid: string, id: string): Promise<void> =>
  (void rid, void id, todo('deleteCategory'));

// swap order with the neighbour in `dir` (writeBatch of two updates)
export const moveCategory = (rid: string, id: string, dir: -1 | 1): Promise<void> =>
  (void rid, void id, void dir, todo('moveCategory'));

export const addItem = (rid: string, input: { categoryId: string; name: string; unit: Unit }): Promise<void> =>
  (void rid, void input, todo('addItem'));

export const updateItem = (
  rid: string,
  id: string,
  patch: { name: string; category: string; unit: Unit; disabled: boolean },
): Promise<void> => (void rid, void id, void patch, todo('updateItem'));

export const deleteItem = (rid: string, id: string): Promise<void> =>
  (void rid, void id, todo('deleteItem'));

export const setItemDisabled = (rid: string, id: string, disabled: boolean): Promise<void> =>
  (void rid, void id, void disabled, todo('setItemDisabled'));
