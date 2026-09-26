import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { eventsApi } from '../../services/api';

export interface EventDog {
  id: string;
  name: string;
  breed: string;
  photoUrl?: string;
}

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
  /** Describes the event photo; the header shows it on the striped stand-in ("event photo — …"). */
  photoCaption?: string;
  photoUrl?: string;
  /** The current viewer's own dogs coming to this event — undefined until fetched with a viewer context. */
  myDogIds?: string[];
  /** Every participant's dogs, keyed by userId — an event RSVP can name more than one, unlike a walk's single dog. */
  participantDogs?: Record<string, EventDog[]>;
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

/** Joining again while already joined replaces the dog list (an explicit `dogIds`, including `[]`, is how "edit
 * my dogs" works) rather than adding a second RSVP. */
export const joinEvent = createAsyncThunk(
  'events/joinEvent',
  async ({ eventId, dogIds }: { eventId: string; dogIds?: string[] }, { rejectWithValue }) => {
    try {
      const res = await eventsApi.join(eventId, dogIds);
      return res.data as Event;
    } catch (err: any) {
      return rejectWithValue(err?.message ?? 'Failed to join event');
    }
  },
);

export const leaveEvent = createAsyncThunk(
  'events/leaveEvent',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const res = await eventsApi.leave(eventId);
      return res.data as Event;
    } catch (err: any) {
      return rejectWithValue(err?.message ?? 'Failed to leave event');
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
      const idx = state.events.findIndex((e) => e.id === action.payload.id);
      if (idx !== -1) {
        state.events[idx] = action.payload;
      } else {
        state.events.unshift(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
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
      .addCase(fetchEventById.fulfilled, (state, action: PayloadAction<Event>) => {
        const idx = state.events.findIndex((e) => e.id === action.payload.id);
        if (idx !== -1) {
          state.events[idx] = action.payload;
        } else {
          state.events.unshift(action.payload);
        }
      })
      .addCase(createEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        state.events.unshift(action.payload);
      })
      .addCase(joinEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        const idx = state.events.findIndex((e) => e.id === action.payload.id);
        if (idx !== -1) {
          state.events[idx] = action.payload;
        } else {
          state.events.unshift(action.payload);
        }
      })
      .addCase(leaveEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        const idx = state.events.findIndex((e) => e.id === action.payload.id);
        if (idx !== -1) {
          state.events[idx] = action.payload;
        } else {
          state.events.unshift(action.payload);
        }
      });
  },
});

export const { clearEventsError, updateEvent } = eventsSlice.actions;
export default eventsSlice.reducer;
