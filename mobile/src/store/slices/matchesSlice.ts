import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { matchesApi } from '../../services/api';

export interface MatchUser {
  id: string;
  displayName: string;
  bio?: string;
  age?: number;
  avatarColor?: string;
  location?: string;
  photoUrl?: string;
  /** Discover deck only: distance from the viewer's home area, in km (0.1 precision). */
  distanceKm?: number;
  dogIds?: string[];
  dogs?: MatchDog[];
}

export interface MatchDog {
  id: string;
  name: string;
  breed: string;
  age: number;
  emoji?: string;
  energy?: string;
  ageGroup?: string;
  personality: string[];
  bio?: string;
}

export interface Match {
  id: string;
  userId: string;
  user?: MatchUser;
  matchedAt: string;
  lastMessage: string;
  lastMessageAt: string;
  /** Who wrote the last message (the chat list prefixes "You: " for our own). Absent while the thread is empty. */
  lastMessageSenderId?: string;
  unread: number;
}

export interface MatchMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  type?: string;
  /** Optimistic message that the server has not confirmed yet. */
  pending?: boolean;
}

interface MatchesState {
  matches: Match[];
  swipeDeck: (MatchUser & { dogs: MatchDog[] })[];
  messages: Record<string, MatchMessage[]>;
  latestMatch: { match: Match; user: MatchUser } | null;
  loading: boolean;
  swipeLoading: boolean;
  error: string | null;
}

const initialState: MatchesState = {
  matches: [],
  swipeDeck: [],
  messages: {},
  latestMatch: null,
  loading: false,
  swipeLoading: false,
  error: null,
};

export const fetchMatches = createAsyncThunk('matches/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await matchesApi.getAll();
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err?.message ?? 'Failed to load matches');
  }
});

export const fetchSwipeDeck = createAsyncThunk('matches/fetchDeck', async (_, { rejectWithValue }) => {
  try {
    const res = await matchesApi.getSwipeDeck();
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err?.message ?? 'Failed to load discover feed');
  }
});

/** "Start over": forgets this user's swipes on the server, then loads the full deck again. */
export const resetSwipes = createAsyncThunk('matches/resetSwipes', async (_, { rejectWithValue }) => {
  try {
    await matchesApi.resetSwipes();
    const res = await matchesApi.getSwipeDeck();
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err?.message ?? 'Failed to reset');
  }
});

export const swipeRight = createAsyncThunk('matches/swipeRight', async (userId: string, { rejectWithValue }) => {
  try {
    const res = await matchesApi.swipeRight(userId);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err?.message ?? 'Failed');
  }
});

export const swipeLeft = createAsyncThunk('matches/swipeLeft', async (userId: string, { rejectWithValue }) => {
  try {
    await matchesApi.swipeLeft(userId);
    return userId;
  } catch (err: any) {
    return rejectWithValue(err?.message ?? 'Failed');
  }
});

export const fetchMatchMessages = createAsyncThunk('matches/fetchMessages', async (matchId: string, { rejectWithValue }) => {
  try {
    const res = await matchesApi.getMessages(matchId);
    return { matchId, messages: res.data };
  } catch (err: any) {
    return rejectWithValue(err?.message ?? 'Failed to load messages');
  }
});

/** Pass `sender` to append the message optimistically right away; the confirmed message replaces the pending one. */
export const sendMatchMessage = createAsyncThunk(
  'matches/sendMessage',
  async ({ matchId, content }: { matchId: string; content: string; sender?: { id: string; name: string } }, { rejectWithValue }) => {
    try {
      const res = await matchesApi.sendMessage(matchId, content);
      return { matchId, message: res.data };
    } catch (err: any) {
      return rejectWithValue(err?.message ?? 'Failed to send message');
    }
  },
);

export const markMatchRead = createAsyncThunk('matches/markRead', async (matchId: string) => {
  await matchesApi.markRead(matchId);
  return matchId;
});

/** Adds a confirmed message once: ignores one already present, and swaps in for our own matching pending one. */
function addIncoming(list: MatchMessage[], msg: MatchMessage) {
  if (list.some((m) => m.id === msg.id)) return;
  const pending = list.findIndex((m) => m.pending && m.senderId === msg.senderId && m.content === msg.content);
  if (pending >= 0) list[pending] = msg;
  else list.push(msg);
}

const matchesSlice = createSlice({
  name: 'matches',
  initialState,
  reducers: {
    clearLatestMatch(state) {
      state.latestMatch = null;
    },
    receiveMatchMessage(state, action: PayloadAction<MatchMessage>) {
      const msg = action.payload;
      if (!state.messages[msg.roomId]) state.messages[msg.roomId] = [];
      addIncoming(state.messages[msg.roomId], msg);
      const match = state.matches.find(m => m.id === msg.roomId);
      if (match) { match.lastMessage = msg.content; match.lastMessageAt = msg.createdAt; match.lastMessageSenderId = msg.senderId; }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchMatches.pending, state => { state.loading = true; state.error = null; })
      .addCase(fetchMatches.fulfilled, (state, action) => { state.loading = false; state.matches = action.payload; })
      .addCase(fetchMatches.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      // Only blank the screen for the first load; refreshing a deck that is on screen must not flash a spinner.
      .addCase(fetchSwipeDeck.pending, state => { state.swipeLoading = state.swipeDeck.length === 0; })
      .addCase(fetchSwipeDeck.fulfilled, (state, action) => { state.swipeLoading = false; state.swipeDeck = action.payload; })
      .addCase(fetchSwipeDeck.rejected, state => { state.swipeLoading = false; })
      .addCase(swipeRight.fulfilled, (state, action) => {
        const { matched, match, user } = action.payload;
        // Remove the swiped card from the deck (by id: the deck may be filtered on screen)
        const card = state.swipeDeck.find(u => u.id === action.meta.arg);
        state.swipeDeck = state.swipeDeck.filter(u => u.id !== action.meta.arg);
        if (matched && match) {
          // Keep the card's dogs and distance: the server's match payload only has the public profile.
          const full = { ...card, ...user };
          state.matches.unshift({ ...match, user: full });
          state.latestMatch = { match, user: full };
        }
      })
      .addCase(swipeLeft.fulfilled, (state, action) => {
        state.swipeDeck = state.swipeDeck.filter(u => u.id !== action.meta.arg);
      })
      .addCase(resetSwipes.fulfilled, (state, action) => { state.swipeLoading = false; state.swipeDeck = action.payload; })
      .addCase(fetchMatchMessages.fulfilled, (state, action) => {
        const { matchId, messages } = action.payload;
        // Keep what arrived while the history was loading (an optimistic send, a socket message newer than the history).
        const ids = new Set(messages.map((m: MatchMessage) => m.id));
        const newest = messages.length ? messages[messages.length - 1].createdAt : '';
        const extra = (state.messages[matchId] ?? []).filter((m) => !ids.has(m.id) && (m.pending || m.createdAt > newest));
        state.messages[matchId] = [...messages, ...extra];
      })
      .addCase(sendMatchMessage.pending, (state, action) => {
        const { matchId, content, sender } = action.meta.arg;
        if (!sender) return;
        if (!state.messages[matchId]) state.messages[matchId] = [];
        state.messages[matchId].push({
          id: `pending-${action.meta.requestId}`, roomId: matchId, senderId: sender.id, senderName: sender.name, content,
          createdAt: new Date().toISOString(), pending: true,
        });
      })
      .addCase(sendMatchMessage.fulfilled, (state, action) => {
        const { matchId, message } = action.payload;
        const list = state.messages[matchId] ?? (state.messages[matchId] = []);
        const at = list.findIndex((m) => m.id === `pending-${action.meta.requestId}`);
        if (list.some((m) => m.id === message.id)) {
          // The socket echo already delivered it.
          if (at >= 0) list.splice(at, 1);
        } else if (at >= 0) list[at] = message;
        else list.push(message);
        const match = state.matches.find(m => m.id === matchId);
        if (match) { match.lastMessage = message.content; match.lastMessageAt = message.createdAt; match.lastMessageSenderId = message.senderId; }
      })
      .addCase(sendMatchMessage.rejected, (state, action) => {
        const { matchId } = action.meta.arg;
        state.messages[matchId] = (state.messages[matchId] ?? []).filter((m) => m.id !== `pending-${action.meta.requestId}`);
      })
      .addCase(markMatchRead.fulfilled, (state, action) => {
        const match = state.matches.find(m => m.id === action.payload);
        if (match) match.unread = 0;
      });
  },
});

export const { clearLatestMatch, receiveMatchMessage } = matchesSlice.actions;
export default matchesSlice.reducer;
