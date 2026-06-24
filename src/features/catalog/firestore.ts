// Firestore for the catalog — YOU implement these (this is the learning part).
// Data lives in restaurants/{rid}/categories and restaurants/{rid}/items.
// Listeners push docs into the slice (categoriesReceived/itemsReceived); the
// write helpers below are called by CatalogContainer. Signatures are fixed —
// fill the bodies with addDoc/updateDoc/writeBatch/onSnapshot.
import type { AppDispatch } from '../../app/store';
import type { Category, Item, Unit } from './types';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { categoriesReceived, itemsReceived } from './catalogSlice';

const categoriesCol = (rid: string) => collection(db, 'restaurants', rid, 'categories');
const itemsCol = (rid: string) => collection(db, 'restaurants', rid, 'items');

// Subscribe to this restaurant's categories + items; returns an unsubscribe.
export function subscribeCatalog(rid: string, dispatch: AppDispatch): () => void {
  const unsubCats = onSnapshot(
    query(categoriesCol(rid), orderBy('order')),
    snap => {
      const cats:Category[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) }));
      dispatch(categoriesReceived(cats));
    }
  )
  const unsubItems = onSnapshot(
    itemsCol(rid),
    snap => {
      const items:Item[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Item, 'id'>) }));
      dispatch(itemsReceived(items));
    }
  )
  return () => {
    unsubCats();
    unsubItems();
  };
}

export const addCategory = async (rid: string, label: string, order: number): Promise<void> => {
  await addDoc(categoriesCol(rid), { label, order });
}

export const renameCategory = (rid: string, id: string, label: string): Promise<void> => 
  updateDoc(doc(categoriesCol(rid), id), { label });

// delete the category AND its items in one writeBatch
export const deleteCategory = async (rid: string, id: string): Promise<void> => {
  const batch = writeBatch(db);
  batch.delete(doc(categoriesCol(rid), id));
  const itemsSnap = await getDocs(query(itemsCol(rid), where('category', '==', id)));
  itemsSnap.forEach(d => batch.delete(d.ref));
  return batch.commit();
}

// swap order with the neighbour in `dir` (writeBatch of two updates)
export const moveCategory = async (rid: string, id: string, dir: -1 | 1): Promise<void> => {
  const snap = await getDocs(query(categoriesCol(rid), orderBy('order')));
  const cats = snap.docs
  const i = cats.findIndex(d => d.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= cats.length) return;
  const batch = writeBatch(db);
  batch.update(cats[i].ref, { order: cats[j].data().order });
  batch.update(cats[j].ref, { order: cats[i].data().order });
  await batch.commit();
}

export const addItem = async (rid: string, input: { categoryId: string; name: string; unit: Unit; order: number }): Promise<void> => {
  await addDoc(itemsCol(rid), {
    name: input.name,
    category: input.categoryId,
    unit: input.unit,
    disabled: false,
    order: input.order,
  })
}

// `order` is included only when the item moves to a different category, so it
// lands at the end of the target category instead of colliding with an existing position.
export const updateItem = (
  rid: string,
  id: string,
  patch: { name: string; category: string; unit: Unit; disabled: boolean; order?: number },
): Promise<void> => updateDoc(doc(itemsCol(rid), id), patch);

export const deleteItem = (rid: string, id: string): Promise<void> => deleteDoc(doc(itemsCol(rid), id));

// persist an explicit ordering: write order = index for each id (drag-and-drop result).
// ids must all belong to the same category — the caller supplies that category's items in their new order.
export const reorderItems = (rid: string, orderedIds: string[]): Promise<void> => {
  const batch = writeBatch(db);
  orderedIds.forEach((id, order) => batch.update(doc(itemsCol(rid), id), { order }));
  return batch.commit();
}

// swap order with the neighbour in `dir`, scoped to the item's own category (writeBatch of two updates)
export const moveItem = async (rid: string, id: string, dir: -1 | 1): Promise<void> => {
  const self = await getDoc(doc(itemsCol(rid), id));
  const category = (self.data() as Item | undefined)?.category;
  if (!category) return;
  const snap = await getDocs(query(itemsCol(rid), where('category', '==', category), orderBy('order')));
  const siblings = snap.docs;
  const i = siblings.findIndex((d) => d.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= siblings.length) return;
  const batch = writeBatch(db);
  batch.update(siblings[i].ref, { order: siblings[j].data().order });
  batch.update(siblings[j].ref, { order: siblings[i].data().order });
  await batch.commit();
}

export const setItemDisabled = (rid: string, id: string, disabled: boolean): Promise<void> => updateDoc(doc(itemsCol(rid), id), { disabled });
