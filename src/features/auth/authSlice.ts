import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Role } from '../../pages/Login';

export interface AuthState {
  user: { uid: string; name: string; email: string } | null;
  role: Role | null;
  restaurantIds: string[];
  status: 'loading' | 'in' | 'out';
}

const initialState: AuthState = { user: null, role: null, restaurantIds: [], status: 'loading' };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authChanged: (_state, action: PayloadAction<AuthState>) => action.payload,
  },
});

export const { authChanged } = authSlice.actions;
export default authSlice.reducer;
