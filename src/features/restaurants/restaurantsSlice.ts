import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Restaurant } from './types';

interface RestaurantsState {
  list: Restaurant[];
  byId: Record<string, Restaurant>;
  currentId: string | null; // the active scope for staff-facing screens
}

const initialState: RestaurantsState = { list: [], byId: {}, currentId: null };

const restaurantsSlice = createSlice({
  name: 'restaurants',
  initialState,
  reducers: {
    restaurantsReceived: (state, action: PayloadAction<Restaurant[]>) => {
      state.list = action.payload;
      state.byId = Object.fromEntries(action.payload.map((r) => [r.id, r]));
    },
    currentRestaurantSet: (state, action: PayloadAction<string>) => {
      state.currentId = action.payload;
    },
  },
});

export const { restaurantsReceived, currentRestaurantSet } = restaurantsSlice.actions;
export default restaurantsSlice.reducer;
