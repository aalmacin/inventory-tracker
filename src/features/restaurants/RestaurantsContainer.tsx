import { useNavigate } from 'react-router-dom';
import { Restaurants, type RestaurantStatVM } from '../../pages/Restaurants';
import { AppHeader } from '../../ui/shell';
import { useAppDispatch, useAppSelector } from '../../lib/hooks';
import { useChrome } from '../../app/useChrome';
import { currentRestaurantSet } from './restaurantsSlice';
import * as fs from './firestore';

export function RestaurantsContainer() {
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const chrome = useChrome();
  const list = useAppSelector((s) => s.restaurants.list);
  const currentId = useAppSelector((s) => s.restaurants.currentId);
  const members = useAppSelector((s) => s.team.members);

  // memberCount comes from the members slice; itemCount/trackingCount/last need
  // per-restaurant counts — wire restaurants/firestore.ts restaurantStats and
  // cache them in a slice (left at 0/null here).
  const restaurants: RestaurantStatVM[] = list.map((r) => ({
    ...r,
    isCurrent: r.id === currentId,
    stats: {
      itemCount: 0,
      trackingCount: 0,
      memberCount: members.filter((m) => m.status === 'active' && m.restaurantIds.includes(r.id)).length,
      lastTrackingMs: null,
    },
  }));

  return (
    <Restaurants
      header={<AppHeader title="Restaurants" account={chrome.account} />}
      restaurants={restaurants}
      onOpen={(id) => {
        dispatch(currentRestaurantSet(id));
        nav('/catalog');
      }}
      onAddRestaurant={(input) => fs.addRestaurant(input)}
      onUpdateRestaurant={(id, input) => fs.updateRestaurant(id, input)}
    />
  );
}
