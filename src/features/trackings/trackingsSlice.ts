import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Tracking } from './types';

interface TrackingsState {
  list: Tracking[]; // newest-first (listener orders by date desc)
}

const initialState: TrackingsState = { list: [] };

const trackingsSlice = createSlice({
  name: 'trackings',
  initialState,
  reducers: {
    trackingsReceived: (state, action: PayloadAction<Tracking[]>) => {
      state.list = action.payload;
    },
    trackingsCleared: () => initialState,
  },
});

export const { trackingsReceived, trackingsCleared } = trackingsSlice.actions;
export default trackingsSlice.reducer;
