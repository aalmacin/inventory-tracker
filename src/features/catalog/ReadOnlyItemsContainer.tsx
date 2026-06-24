import { useMemo } from 'react';
import { Items } from '../../pages/Items';
import { useAppSelector } from '../../lib/hooks';
import { selectCurrentRestaurant } from '../restaurants/selectors';

export function ReadOnlyItemsContainer() {
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
          items: items
            .filter((i) => i.category === c.id && !i.disabled)
            .sort((a, b) => a.order - b.order)
            .map((i) => ({ id: i.id, name: i.name })),
        })),
    [cats, items],
  );

  return <Items restaurantName={current?.name ?? ''} categories={categories} />;
}
