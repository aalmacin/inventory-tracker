import { useMemo } from 'react';
import { Catalog } from '../../pages/Catalog';
import { RestaurantSelect } from '../../pages/RestaurantSelect';
import { useAppDispatch, useAppSelector } from '../../lib/hooks';
import { selectCurrentRestaurant, selectMyRestaurants } from '../restaurants/selectors';
import { currentRestaurantSet } from '../restaurants/restaurantsSlice';
import * as fs from './firestore';

export function CatalogContainer() {
  const dispatch = useAppDispatch();
  const rid = useAppSelector((s) => s.restaurants.currentId);
  const cats = useAppSelector((s) => s.catalog.categories);
  const items = useAppSelector((s) => s.catalog.items);
  const current = useAppSelector(selectCurrentRestaurant);
  const mine = useAppSelector(selectMyRestaurants);
  const userName = useAppSelector((s) => s.auth.user?.name || undefined);

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

  // No restaurant chosen yet → show the same picker the login flow uses, in place,
  // so the admin can pick from the Catalog tab without leaving it. Selecting sets
  // currentId; this container then re-renders into the catalog for that restaurant.
  if (!rid) {
    return (
      <RestaurantSelect
        restaurants={mine.map((r) => ({ id: r.id, name: r.name, city: r.city, initials: r.initials, tint: r.tint }))}
        userName={userName}
        onSelect={(id) => dispatch(currentRestaurantSet(id))}
      />
    );
  }

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
