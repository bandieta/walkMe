import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { usersApi } from '../../services/api';

export interface Dog {
  id: string;
  name: string;
  breed: string;
  age: number;
  weight?: number;
  photoUrl?: string;
  ownerId: string;
}

interface DogsState {
  dogs: Dog[];
  loading: boolean;
  error: string | null;
}

const initialState: DogsState = {
  dogs: [],
  loading: false,
  error: null,
};

export const fetchMyDogs = createAsyncThunk(
  'dogs/fetchMyDogs',
  async (_, { rejectWithValue }) => {
    try {
      const res = await usersApi.getMyDogs();
      return res.data as Dog[];
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? 'Failed to load dogs');
    }
  },
);

export const createDog = createAsyncThunk(
  'dogs/createDog',
  async (payload: Omit<Dog, 'id' | 'ownerId'>, { rejectWithValue }) => {
    try {
      const res = await usersApi.createDog(payload);
      return res.data as Dog;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? 'Failed to create dog');
    }
  },
);

export const deleteDog = createAsyncThunk(
  'dogs/deleteDog',
  async (dogId: string, { rejectWithValue }) => {
    try {
      await usersApi.deleteDog(dogId);
      return dogId;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? 'Failed to delete dog');
    }
  },
);

const dogsSlice = createSlice({
  name: 'dogs',
  initialState,
  reducers: {
    clearDogsError(state) {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchMyDogs.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyDogs.fulfilled, (state, action: PayloadAction<Dog[]>) => {
        state.loading = false;
        state.dogs = action.payload;
      })
      .addCase(fetchMyDogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createDog.fulfilled, (state, action: PayloadAction<Dog>) => {
        state.dogs.push(action.payload);
      })
      .addCase(deleteDog.fulfilled, (state, action: PayloadAction<string>) => {
        state.dogs = state.dogs.filter(d => d.id !== action.payload);
      });
  },
});

export const { clearDogsError } = dogsSlice.actions;
export default dogsSlice.reducer;
