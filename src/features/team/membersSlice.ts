import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Member } from './types';

interface TeamState {
  members: Member[];
}

const initialState: TeamState = { members: [] };

const membersSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    membersReceived: (state, action: PayloadAction<Member[]>) => {
      state.members = action.payload;
    },
  },
});

export const { membersReceived } = membersSlice.actions;
export default membersSlice.reducer;
