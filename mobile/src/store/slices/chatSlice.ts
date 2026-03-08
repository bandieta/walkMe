import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { chatApi } from '../../services/api';

export interface ChatMessage {
  id: string;
  walkId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  content: string;
  createdAt: string;
}

export interface ChatRoom {
  walkId: string;
  walkTitle: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

interface ChatState {
  rooms: ChatRoom[];
  messages: Record<string, ChatMessage[]>;
  activeRoomId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  rooms: [],
  messages: {},
  activeRoomId: null,
  loading: false,
  error: null,
};

export const fetchChatRooms = createAsyncThunk(
  'chat/fetchChatRooms',
  async (_, { rejectWithValue }) => {
    try {
      const res = await chatApi.getRooms();
      return res.data as ChatRoom[];
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? 'Failed to load chat rooms');
    }
  },
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (walkId: string, { rejectWithValue }) => {
    try {
      const res = await chatApi.getMessages(walkId);
      return { walkId, messages: res.data as ChatMessage[] };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? 'Failed to load messages');
    }
  },
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveRoom(state, action: PayloadAction<string | null>) {
      state.activeRoomId = action.payload;
    },
    receiveMessage(state, action: PayloadAction<ChatMessage>) {
      const msg = action.payload;
      if (!state.messages[msg.walkId]) {
        state.messages[msg.walkId] = [];
      }
      state.messages[msg.walkId].push(msg);

      const room = state.rooms.find(r => r.walkId === msg.walkId);
      if (room) {
        room.lastMessage = msg;
        if (state.activeRoomId !== msg.walkId) {
          room.unreadCount += 1;
        }
      }
    },
    markRoomRead(state, action: PayloadAction<string>) {
      const room = state.rooms.find(r => r.walkId === action.payload);
      if (room) room.unreadCount = 0;
    },
    clearChatError(state) {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchChatRooms.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatRooms.fulfilled, (state, action: PayloadAction<ChatRoom[]>) => {
        state.loading = false;
        state.rooms = action.payload;
      })
      .addCase(fetchChatRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMessages.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages[action.payload.walkId] = action.payload.messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setActiveRoom, receiveMessage, markRoomRead, clearChatError } = chatSlice.actions;
export default chatSlice.reducer;
