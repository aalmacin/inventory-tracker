import { configureStore } from '@reduxjs/toolkit';
import auth from '../features/auth/authSlice';
import restaurants from '../features/restaurants/restaurantsSlice';
import catalog from '../features/catalog/catalogSlice';
import trackings from '../features/trackings/trackingsSlice';
import team from '../features/team/membersSlice';

// The active restaurant is the only slice we persist: without it, a page reload
// drops the in-memory selection and the RequireRestaurant guard bounces the user
// back to the picker on every refresh.
const CURRENT_RESTAURANT_KEY = 'inventory-tracker:currentRestaurantId';

function loadCurrentRestaurantId(): string | null {
  try {
    return localStorage.getItem(CURRENT_RESTAURANT_KEY);
  } catch {
    return null; // storage unavailable (private mode / disabled) — start unscoped
  }
}

export const store = configureStore({
  reducer: { auth, restaurants, catalog, trackings, team },
  preloadedState: {
    restaurants: { list: [], byId: {}, currentId: loadCurrentRestaurantId() },
  },
});

let persistedId = store.getState().restaurants.currentId;
store.subscribe(() => {
  const { currentId } = store.getState().restaurants;
  if (currentId === persistedId) return;
  persistedId = currentId;
  try {
    if (currentId) localStorage.setItem(CURRENT_RESTAURANT_KEY, currentId);
    else localStorage.removeItem(CURRENT_RESTAURANT_KEY);
  } catch {
    /* storage write failed — selection just won't survive a reload */
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
