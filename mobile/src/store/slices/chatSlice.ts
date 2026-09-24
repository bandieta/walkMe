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
  roomId?: string;
  type?: string;
  /** Optimistic message that the server has not confirmed yet. */
  pending?: boolean;
}

export interface ChatRoom {
  walkId: string;
  walkTitle: string;
  lastMessage?: ChatMessage | null;
  unreadCount: number;
  /** "upcoming" | "live" | "ended", the walk's category and start time (the chat list shows an icon and "Live now" / "In 2 h"). */
  walkStatus?: string;
  walkCategory?: string;
  scheduledAt?: string;
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

/**
 * Sends a walk group message over REST (the server also broadcasts it to the socket room). Pass `sender` to append it
 * optimistically right away; the confirmed message replaces the pending one.
 */
export const sendWalkMessage = createAsyncThunk(
  'chat/sendMessage',
  async (
    { walkId, content }: { walkId: string; content: string; sender?: { id: string; name: string } },
    { rejectWithValue },
  ) => {
    try {
      const res = await chatApi.sendMessage(walkId, content);
      return { walkId, message: res.data as ChatMessage };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? err?.message ?? 'Failed to send message');
    }
  },
);

/**
 * Adds a confirmed message once: ignores one already present, and swaps in for our own matching pending one.
 * Returns whether this was a genuinely new message from someone else — as opposed to a duplicate delivery (the
 * global listener and a screen's own room listener can both receive the same socket event) or our own optimistic
 * send being confirmed — which is what unread-count bumps should key off, so a message is never double-counted.
 */
function addIncoming(list: ChatMessage[], msg: ChatMessage): boolean {
  if (list.some((m) => m.id === msg.id)) return false;
  const pending = list.findIndex((m) => m.pending && m.senderId === msg.senderId && m.content === msg.content);
  if (pending >= 0) {
    list[pending] = msg;
    return false;
  }
  list.push(msg);
  return true;
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveRoom(state, action: PayloadAction<string | null>) {
      state.activeRoomId = action.payload;
    },
    receiveMessage(state, action: PayloadAction<ChatMessage>) {
      const msg = action.payload;
      const walkId = msg.walkId ?? msg.roomId ?? '';
      if (!state.messages[walkId]) {
        state.messages[walkId] = [];
      }
      const isNew = addIncoming(state.messages[walkId], { ...msg, walkId });

      const room = state.rooms.find(r => r.walkId === walkId);
      if (room) {
        room.lastMessage = msg;
        if (isNew && state.activeRoomId !== walkId) {
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
        const { walkId, messages } = action.payload;
        // Keep what arrived while the history was loading (an optimistic send, a socket message newer than the history).
        const ids = new Set(messages.map((m) => m.id));
        const newest = messages.length ? messages[messages.length - 1].createdAt : '';
        const extra = (state.messages[walkId] ?? []).filter((m) => !ids.has(m.id) && (m.pending || m.createdAt > newest));
        state.messages[walkId] = [...messages, ...extra];
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(sendWalkMessage.pending, (state, action) => {
        const { walkId, content, sender } = action.meta.arg;
        if (!sender) return;
        if (!state.messages[walkId]) state.messages[walkId] = [];
        state.messages[walkId].push({
          id: `pending-${action.meta.requestId}`, walkId, senderId: sender.id, senderName: sender.name, content,
          createdAt: new Date().toISOString(), pending: true,
        });
      })
      .addCase(sendWalkMessage.fulfilled, (state, action) => {
        const { walkId, message } = action.payload;
        const list = state.messages[walkId] ?? (state.messages[walkId] = []);
        const at = list.findIndex((m) => m.id === `pending-${action.meta.requestId}`);
        if (list.some((m) => m.id === message.id)) {
          // The socket echo already delivered it.
          if (at >= 0) list.splice(at, 1);
        } else if (at >= 0) list[at] = { ...message, walkId };
        else list.push({ ...message, walkId });
        const room = state.rooms.find((r) => r.walkId === walkId);
        if (room) room.lastMessage = message;
      })
      .addCase(sendWalkMessage.rejected, (state, action) => {
        const { walkId } = action.meta.arg;
        state.messages[walkId] = (state.messages[walkId] ?? []).filter((m) => m.id !== `pending-${action.meta.requestId}`);
      });
  },
});

export const { setActiveRoom, receiveMessage, markRoomRead, clearChatError } = chatSlice.actions;
export default chatSlice.reducer;
