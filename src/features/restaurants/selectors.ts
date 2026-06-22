import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

export const selectCurrentRestaurant = (s: RootState) =>
  s.restaurants.currentId ? s.restaurants.byId[s.restaurants.currentId] ?? null : null;

// restaurants this user may switch between (admin sees all)
export const selectMyRestaurants = createSelector(
  [(s: RootState) => s.restaurants.list, (s: RootState) => s.auth.role, (s: RootState) => s.auth.restaurantIds],
  (list, role, ids) => (role === 'admin' ? list : list.filter((r) => ids.includes(r.id))),
);
