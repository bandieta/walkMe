import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, usersApi } from '../../services/api';

interface AuthState {
  user: { id: string; email?: string; displayName: string; photoUrl?: string; bio?: string; location?: string; walkTimes?: string[]; radiusKm?: number; onboarded?: boolean } | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  /** Answers collected on onboarding step 2 (walking rhythm); step 3 sends them with the location and finishes onboarding. */
  onboardingDraft: { walkTimes: string[]; radiusKm: number } | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  loading: false,
  error: null,
  onboardingDraft: null,
};

async function persistSession(data: { token: string; refreshToken: string }) {
  await AsyncStorage.multiSet([
    ['accessToken', data.token],
    ['refreshToken', data.refreshToken],
  ]);
}

export const socialLogin = createAsyncThunk(
  'auth/socialLogin',
  async (
    { provider, token, displayName }: { provider: 'google' | 'facebook' | 'apple'; token: string; displayName?: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await authApi.socialLogin(provider, token, displayName);
      await persistSession({ token: response.data.accessToken, refreshToken: response.data.refreshToken });
      return { user: response.data.user, token: response.data.accessToken, refreshToken: response.data.refreshToken };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.error?.message ?? 'Sign-in failed');
    }
  },
);

// Dev-only convenience login so the app is usable end-to-end before real
// Google/Facebook/Apple developer credentials are configured. The button
// that dispatches this only renders in __DEV__ builds (see LoginScreen).
export const devLogin = createAsyncThunk(
  'auth/devLogin',
  async (displayName: string, { rejectWithValue }) => {
    try {
      const response = await authApi.devLogin(displayName);
      await persistSession({ token: response.data.accessToken, refreshToken: response.data.refreshToken });
      return { user: response.data.user, token: response.data.accessToken, refreshToken: response.data.refreshToken };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.error?.message ?? 'Dev login failed');
    }
  },
);

// Runs once at startup (see SplashScreen/AppNavigator): a stored access
// token alone used to be enough to keep the token in state but not the
// user, so the auth guard bounced back to Login on every app restart. This
// fetches the user that the stored token belongs to, or clears the stale
// token if it's no longer valid.
export const restoreSession = createAsyncThunk('auth/restoreSession', async (_, { rejectWithValue }) => {
  const entries = await AsyncStorage.multiGet(['accessToken', 'refreshToken']);
  const token = entries[0][1];
  const refreshToken = entries[1][1];
  if (!token) return rejectWithValue('No stored session');
  try {
    const me = await usersApi.getMe();
    return { user: me.data, token, refreshToken: refreshToken ?? '' };
  } catch {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
    return rejectWithValue('Stored session is no longer valid');
  }
});

export const logoutAndInvalidate = createAsyncThunk('auth/logout', async (_, { getState }) => {
  const state = getState() as { auth: AuthState };
  if (state.auth.refreshToken) {
    await authApi.logout(state.auth.refreshToken).catch(() => undefined);
  }
  await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
    },
    /** Merge fresh profile fields (e.g. after finishing onboarding or editing the profile). */
    userUpdated(state, action: PayloadAction<Partial<NonNullable<AuthState['user']>>>) {
      if (state.user) state.user = { ...state.user, ...action.payload };
    },
    /** Remember the walking-rhythm answers between onboarding step 2 and 3 (null clears them). */
    onboardingDraftSet(state, action: PayloadAction<AuthState['onboardingDraft']>) {
      state.onboardingDraft = action.payload;
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
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
    };
    const handleRejected = (state: AuthState, action: any) => {
      state.loading = false;
      state.error = (action.payload as string) ?? action.error?.message ?? 'Authentication failed';
    };

    builder
      .addCase(socialLogin.pending, handlePending)
      .addCase(socialLogin.fulfilled, handleFulfilled)
      .addCase(socialLogin.rejected, handleRejected)
      .addCase(devLogin.pending, handlePending)
      .addCase(devLogin.fulfilled, handleFulfilled)
      .addCase(devLogin.rejected, handleRejected)
      .addCase(restoreSession.fulfilled, handleFulfilled)
      .addCase(logoutAndInvalidate.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.onboardingDraft = null;
      });
  },
});

export const { logout, userUpdated, onboardingDraftSet } = authSlice.actions;
export default authSlice.reducer;
