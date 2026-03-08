import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  organizerId: string;
  participantCount: number;
  isJoined: boolean;
  status: 'upcoming' | 'live' | 'ended';
}

interface EventsState {
  events: Event[];
  myEvents: Event[];
  loading: boolean;
  error: string | null;
}

const initialState: EventsState = {
  events: [],
  myEvents: [],
  loading: false,
  error: null,
};

// Placeholder thunks — wired to real API when eventsApi is added
export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: replace with eventsApi.getAll()
      return [] as Event[];
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? 'Failed to load events');
    }
  },
);

export const createEvent = createAsyncThunk(
  'events/createEvent',
  async (payload: Omit<Event, 'id' | 'participantCount' | 'isJoined'>, { rejectWithValue }) => {
    try {
      // TODO: replace with eventsApi.create(payload)
      return { ...payload, id: Date.now().toString(), participantCount: 1, isJoined: true } as Event;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? 'Failed to create event');
    }
  },
);

export const joinEvent = createAsyncThunk(
  'events/joinEvent',
  async (eventId: string, { rejectWithValue }) => {
    try {
      // TODO: replace with eventsApi.join(eventId)
      return eventId;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? 'Failed to join event');
    }
  },
);

export const leaveEvent = createAsyncThunk(
  'events/leaveEvent',
  async (eventId: string, { rejectWithValue }) => {
    try {
      // TODO: replace with eventsApi.leave(eventId)
      return eventId;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? 'Failed to leave event');
    }
  },
);

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearEventsError(state) {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchEvents.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action: PayloadAction<Event[]>) => {
        state.loading = false;
        state.events = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        state.events.unshift(action.payload);
        state.myEvents.unshift(action.payload);
      })
      .addCase(joinEvent.fulfilled, (state, action: PayloadAction<string>) => {
        const event = state.events.find(e => e.id === action.payload);
        if (event) {
          event.isJoined = true;
          event.participantCount += 1;
        }
      })
      .addCase(leaveEvent.fulfilled, (state, action: PayloadAction<string>) => {
        const event = state.events.find(e => e.id === action.payload);
        if (event) {
          event.isJoined = false;
          event.participantCount = Math.max(0, event.participantCount - 1);
        }
      });
  },
});

export const { clearEventsError } = eventsSlice.actions;
export default eventsSlice.reducer;
