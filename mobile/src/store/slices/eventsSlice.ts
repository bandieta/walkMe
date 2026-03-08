import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { eventsApi } from '../../services/api';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  lat?: number;
  lng?: number;
  organizerId: string;
  organizer?: any;
  participantCount: number;
  maxParticipants: number;
  isJoined: boolean;
  status: 'upcoming' | 'live' | 'ended';
  category?: string;
  emoji?: string;
}

interface EventsState {
  events: Event[];
  loading: boolean;
  error: string | null;
}

const initialState: EventsState = {
  events: [],
  loading: false,
  error: null,
};

export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async (_, { rejectWithValue }) => {
    try {
      const res = await eventsApi.list();
      return res.data as Event[];
    } catch (err: any) {
      return rejectWithValue(err?.message ?? 'Failed to load events');
    }
  },
);

export const fetchEventById = createAsyncThunk(
  'events/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await eventsApi.getById(id);
      return res.data as Event;
    } catch (err: any) {
      return rejectWithValue(err?.message ?? 'Failed to load event');
    }
  },
);

export const createEvent = createAsyncThunk(
  'events/createEvent',
  async (payload: Partial<Event>, { rejectWithValue }) => {
    try {
      const res = await eventsApi.create(payload);
      return res.data as Event;
    } catch (err: any) {
      return rejectWithValue(err?.message ?? 'Failed to create event');
    }
  },
);

export const joinEvent = createAsyncThunk(
  'events/joinEvent',
  async (eventId: string, { rejectWithValue }) => {
    try {
      await eventsApi.join(eventId);
      return eventId;
    } catch (err: any) {
      return rejectWithValue(err?.message ?? 'Failed to join event');
    }
  },
);

export const leaveEvent = createAsyncThunk(
  'events/leaveEvent',
  async (eventId: string, { rejectWithValue }) => {
    try {
      await eventsApi.leave(eventId);
      return eventId;
    } catch (err: any) {
      return rejectWithValue(err?.message ?? 'Failed to leave event');
    }
  },
);
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
    updateEvent(state, action: PayloadAction<Event>) {
      const idx = state.events.findIndex(e => e.id === action.payload.id);
      if (idx !== -1) state.events[idx] = action.payload;
      else state.events.unshift(action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchEvents.pending, state => { state.loading = true; state.error = null; })
      .addCase(fetchEvents.fulfilled, (state, action: PayloadAction<Event[]>) => { state.loading = false; state.events = action.payload; })
      .addCase(fetchEvents.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchEventById.fulfilled, (state, action: PayloadAction<Event>) => {
        const idx = state.events.findIndex(e => e.id === action.payload.id);
        if (idx !== -1) state.events[idx] = action.payload;
        else state.events.unshift(action.payload);
      })
      .addCase(createEvent.fulfilled, (state, action: PayloadAction<Event>) => { state.events.unshift(action.payload); })
      .addCase(joinEvent.fulfilled, (state, action: PayloadAction<string>) => {
        const event = state.events.find(e => e.id === action.payload);
        if (event) { event.isJoined = true; event.participantCount++; }
      })
      .addCase(leaveEvent.fulfilled, (state, action: PayloadAction<string>) => {
        const event = state.events.find(e => e.id === action.payload);
        if (event) { event.isJoined = false; event.participantCount = Math.max(0, event.participantCount - 1); }
      });
  },
});

export const { clearEventsError, updateEvent } = eventsSlice.actions;
export default eventsSlice.reducer;
