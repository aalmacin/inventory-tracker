import { useMemo } from 'react';
import { Catalog } from '../../pages/Catalog';
import { useAppSelector } from '../../lib/hooks';
import { selectCurrentRestaurant } from '../restaurants/selectors';
import * as fs from './firestore';

export function CatalogContainer() {
  const rid = useAppSelector((s) => s.restaurants.currentId);
  const cats = useAppSelector((s) => s.catalog.categories);
  const items = useAppSelector((s) => s.catalog.items);
  const current = useAppSelector(selectCurrentRestaurant);

  const categories = useMemo(
    () =>
      [...cats]
        .sort((a, b) => a.order - b.order)
        .map((c) => ({
          id: c.id,
          label: c.label,
          items: items.filter((i) => i.category === c.id).map((i) => ({ id: i.id, name: i.name, unit: i.unit, disabled: i.disabled })),
        })),
    [cats, items],
  );

  if (!rid) return null;

  return (
    <Catalog
      restaurantName={current?.name ?? ''}
      categories={categories}
      onAddCategory={(label) => fs.addCategory(rid, label, cats.length)}
      onRenameCategory={(id, label) => fs.renameCategory(rid, id, label)}
      onDeleteCategory={(id) => fs.deleteCategory(rid, id)}
      onMoveCategory={(id, dir) => fs.moveCategory(rid, id, dir)}
      onAddItem={(input) => fs.addItem(rid, input)}
      onUpdateItem={(id, patch) => fs.updateItem(rid, id, patch)}
      onDeleteItem={(id) => fs.deleteItem(rid, id)}
      onToggleItem={(id, active) => fs.setItemDisabled(rid, id, !active)}
    />
  );
}
