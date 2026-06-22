import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Category, Item } from './types';

interface CatalogState {
  categories: Category[];
  items: Item[];
}

const initialState: CatalogState = { categories: [], items: [] };

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    categoriesReceived: (state, action: PayloadAction<Category[]>) => {
      state.categories = action.payload;
    },
    itemsReceived: (state, action: PayloadAction<Item[]>) => {
      state.items = action.payload;
    },
    catalogCleared: () => initialState, // on restaurant switch / sign-out
  },
});

export const { categoriesReceived, itemsReceived, catalogCleared } = catalogSlice.actions;
export default catalogSlice.reducer;
