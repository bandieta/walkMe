import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { walksApi } from '../../services/api';

interface Walk {
  id: string;
  title: string;
  description?: string;
  meetingLat: number;
  meetingLng: number;
  status: string;
  maxParticipants: number;
  scheduledAt: string;
  host: { id: string; displayName: string; photoUrl?: string };
  participants: { id: string; displayName: string }[];
}

interface WalksState {
  walks: Walk[];
  currentWalk: Walk | null;
  loading: boolean;
  error: string | null;
}

const initialState: WalksState = {
  walks: [],
  currentWalk: null,
  loading: false,
  error: null,
};

export const fetchNearbyWalks = createAsyncThunk(
  'walks/fetchNearby',
  async (_args?: { lat?: number; lng?: number; radiusKm?: number }) => {
    const response = await walksApi.list();
    return response.data;
  },
);

export const fetchWalkById = createAsyncThunk('walks/fetchById', async (id: string) => {
  const response = await walksApi.getById(id);
  return response.data;
});

export const joinWalk = createAsyncThunk('walks/join', async (id: string) => {
  const response = await walksApi.join(id);
  return response.data;
});

export const leaveWalk = createAsyncThunk('walks/leave', async (id: string) => {
  const response = await walksApi.leave(id);
  return response.data;
});

const walksSlice = createSlice({
  name: 'walks',
  initialState,
  reducers: {
    setCurrentWalk(state, action: PayloadAction<Walk>) {
      state.currentWalk = action.payload;
    },
    clearCurrentWalk(state) {
      state.currentWalk = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNearbyWalks.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchNearbyWalks.fulfilled, (state, action) => {
        state.loading = false;
        state.walks = action.payload;
      })
      .addCase(fetchNearbyWalks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch walks';
      })
      .addCase(fetchWalkById.fulfilled, (state, action) => {
        state.currentWalk = action.payload;
      })
      .addCase(joinWalk.fulfilled, (state, action) => {
        state.currentWalk = action.payload;
      })
      .addCase(leaveWalk.fulfilled, (state, action) => {
        state.currentWalk = action.payload;
      });
  },
});

export const { setCurrentWalk, clearCurrentWalk } = walksSlice.actions;
export default walksSlice.reducer;
