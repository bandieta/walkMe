import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { usersApi } from '../../services/api';

export interface DogProfile {
  id: string;
  name: string;
  breed: string;
  age: number;
  photoUrl?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  dogs: DogProfile[];
}

interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  updating: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  profile: null,
  loading: false,
  updating: false,
  error: null,
};

export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (userId: string, { rejectWithValue }) => {
    try {
      const res = await usersApi.getProfile(userId);
      return res.data as UserProfile;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? 'Failed to load profile');
    }
  },
);

export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (payload: Partial<UserProfile>, { rejectWithValue }) => {
    try {
      const res = await usersApi.updateProfile(payload);
      return res.data as UserProfile;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? 'Failed to update profile');
    }
  },
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfileError(state) {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchProfile.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateProfile.pending, state => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.updating = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearProfileError } = profileSlice.actions;
export default profileSlice.reducer;
