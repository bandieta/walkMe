import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../../services/api';

interface AuthState {
  user: { id: string; email: string; displayName: string; photoUrl?: string } | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const response = await authApi.login(email, password);
    await AsyncStorage.setItem('accessToken', response.data.accessToken);
    return response.data;
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ email, displayName, password }: { email: string; displayName: string; password: string }) => {
    const response = await authApi.register(email, displayName, password);
    await AsyncStorage.setItem('accessToken', response.data.accessToken);
    return response.data;
  },
);

export const firebaseLogin = createAsyncThunk(
  'auth/firebaseLogin',
  async (idToken: string) => {
    const response = await authApi.firebaseLogin(idToken);
    await AsyncStorage.setItem('accessToken', response.data.accessToken);
    return response.data;
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      AsyncStorage.removeItem('accessToken');
    },
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state: AuthState) => {
      state.loading = true;
      state.error = null;
    };
    const handleFulfilled = (state: AuthState, action: PayloadAction<any>) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
    };
    const handleRejected = (state: AuthState, action: any) => {
      state.loading = false;
      state.error = action.error.message ?? 'Authentication failed';
    };

    builder
      .addCase(login.pending, handlePending)
      .addCase(login.fulfilled, handleFulfilled)
      .addCase(login.rejected, handleRejected)
      .addCase(register.pending, handlePending)
      .addCase(register.fulfilled, handleFulfilled)
      .addCase(register.rejected, handleRejected)
      .addCase(firebaseLogin.pending, handlePending)
      .addCase(firebaseLogin.fulfilled, handleFulfilled)
      .addCase(firebaseLogin.rejected, handleRejected);
  },
});

export const { logout, setToken } = authSlice.actions;
export default authSlice.reducer;
