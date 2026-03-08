import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { matchesApi } from '../../services/api';

export interface MatchUser {
  id: string;
  displayName: string;
  bio?: string;
  age?: number;
  avatarColor?: string;
  dogIds?: string[];
  dogs?: MatchDog[];
}

export interface MatchDog {
  id: string;
  name: string;
  breed: string;
  age: number;
  emoji: string;
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
  unread: number;
}

export interface MatchMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
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

export const sendMatchMessage = createAsyncThunk(
  'matches/sendMessage',
  async ({ matchId, content }: { matchId: string; content: string }, { rejectWithValue }) => {
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
      state.messages[msg.roomId].push(msg);
      const match = state.matches.find(m => m.id === msg.roomId);
      if (match) { match.lastMessage = msg.content; match.lastMessageAt = msg.createdAt; }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchMatches.pending, state => { state.loading = true; state.error = null; })
      .addCase(fetchMatches.fulfilled, (state, action) => { state.loading = false; state.matches = action.payload; })
      .addCase(fetchMatches.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchSwipeDeck.pending, state => { state.swipeLoading = true; })
      .addCase(fetchSwipeDeck.fulfilled, (state, action) => { state.swipeLoading = false; state.swipeDeck = action.payload; })
      .addCase(fetchSwipeDeck.rejected, state => { state.swipeLoading = false; })
      .addCase(swipeRight.fulfilled, (state, action) => {
        const { matched, match, user } = action.payload;
        // Remove from deck
        if (state.swipeDeck.length > 0) state.swipeDeck.shift();
        if (matched && match) {
          state.matches.unshift({ ...match, user });
          state.latestMatch = { match, user };
        }
      })
      .addCase(swipeLeft.fulfilled, state => {
        if (state.swipeDeck.length > 0) state.swipeDeck.shift();
      })
      .addCase(fetchMatchMessages.fulfilled, (state, action) => {
        state.messages[action.payload.matchId] = action.payload.messages;
      })
      .addCase(sendMatchMessage.fulfilled, (state, action) => {
        const { matchId, message } = action.payload;
        if (!state.messages[matchId]) state.messages[matchId] = [];
        state.messages[matchId].push(message);
        const match = state.matches.find(m => m.id === matchId);
        if (match) { match.lastMessage = message.content; match.lastMessageAt = message.createdAt; }
      })
      .addCase(markMatchRead.fulfilled, (state, action) => {
        const match = state.matches.find(m => m.id === action.payload);
        if (match) match.unread = 0;
      });
  },
});

export const { clearLatestMatch, receiveMatchMessage } = matchesSlice.actions;
export default matchesSlice.reducer;
