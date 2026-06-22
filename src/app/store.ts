import { configureStore } from '@reduxjs/toolkit';
import auth from '../features/auth/authSlice';
import restaurants from '../features/restaurants/restaurantsSlice';
import catalog from '../features/catalog/catalogSlice';
import trackings from '../features/trackings/trackingsSlice';
import team from '../features/team/membersSlice';

export const store = configureStore({
  reducer: { auth, restaurants, catalog, trackings, team },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
