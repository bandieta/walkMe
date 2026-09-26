import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { shelterRequestsApi, MessageType } from '../../services/api';
import type { MatchDog, MatchUser } from './matchesSlice';

export interface DogRequest {
  id: string;
  dogId: string;
  dog: MatchDog;
  requesterId: string;
  requester: MatchUser;
  shelterId: string;
  shelter: MatchUser;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  respondedAt?: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

export interface DogRequestMessage {
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

interface ShelterRequestsState {
  requests: DogRequest[];
  messages: Record<string, DogRequestMessage[]>;
  loading: boolean;
  error: string | null;
  /** The request whose thread is currently open — an incoming message for this one shouldn't bump its badge. */
  activeRequestId: string | null;
}

const initialState: ShelterRequestsState = {
  requests: [],
  messages: {},
  loading: false,
  error: null,
  activeRequestId: null,
};

export const fetchDogRequests = createAsyncThunk(
  'shelterRequests/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await shelterRequestsApi.getAll();
      return res.data as DogRequest[];
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.error?.message ?? 'Failed to load requests');
    }
  },
);

export const acceptDogRequest = createAsyncThunk(
  'shelterRequests/accept',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await shelterRequestsApi.accept(id);
      return res.data as DogRequest;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.error?.message ?? 'Failed to accept');
    }
  },
);

export const declineDogRequest = createAsyncThunk(
  'shelterRequests/decline',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await shelterRequestsApi.decline(id);
      return res.data as DogRequest;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.error?.message ?? 'Failed to decline');
    }
  },
);

export const fetchDogRequestMessages = createAsyncThunk(
  'shelterRequests/fetchMessages',
  async (requestId: string, { rejectWithValue }) => {
    try {
      const res = await shelterRequestsApi.getMessages(requestId);
      return { requestId, messages: res.data as DogRequestMessage[] };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.error?.message ?? 'Failed to load messages');
    }
  },
);

/** Pass `sender` to append the message optimistically right away; the confirmed message replaces the pending one. */
export const sendDogRequestMessage = createAsyncThunk(
  'shelterRequests/sendMessage',
  async (
    {
      requestId,
      content,
      type = 'text',
    }: {
      requestId: string;
      content: string;
      type?: MessageType;
      sender?: { id: string; name: string };
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await shelterRequestsApi.sendMessage(requestId, content, type);
      return { requestId, message: res.data as DogRequestMessage };
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.error?.message ?? err?.message ?? 'Failed to send message',
      );
    }
  },
);

export const markDogRequestRead = createAsyncThunk(
  'shelterRequests/markRead',
  async (requestId: string) => {
    await shelterRequestsApi.markRead(requestId);
    return requestId;
  },
);

/** Same dedupe/optimistic-replace rule as chatSlice/matchesSlice — see their addIncoming for why it returns `isNew`. */
function addIncoming(list: DogRequestMessage[], msg: DogRequestMessage): boolean {
  if (list.some((m) => m.id === msg.id)) {
    return false;
  }
  const pending = list.findIndex(
    (m) => m.pending && m.senderId === msg.senderId && m.content === msg.content,
  );
  if (pending >= 0) {
    list[pending] = msg;
    return false;
  }
  list.push(msg);
  return true;
}

const shelterRequestsSlice = createSlice({
  name: 'shelterRequests',
  initialState,
  reducers: {
    setActiveRequest(state, action: PayloadAction<string | null>) {
      state.activeRequestId = action.payload;
    },
    receiveDogRequestMessage(state, action: PayloadAction<DogRequestMessage>) {
      const msg = action.payload;
      if (!state.messages[msg.roomId]) {
        state.messages[msg.roomId] = [];
      }
      const isNew = addIncoming(state.messages[msg.roomId], msg);
      const request = state.requests.find((r) => r.id === msg.roomId);
      if (request) {
        request.lastMessage = msg.content;
        request.lastMessageAt = msg.createdAt;
        if (isNew && state.activeRequestId !== msg.roomId) {
          request.unread += 1;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDogRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDogRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(fetchDogRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(acceptDogRequest.fulfilled, (state, action) => {
        const i = state.requests.findIndex((r) => r.id === action.payload.id);
        if (i >= 0) {
          state.requests[i] = action.payload;
        }
      })
      .addCase(declineDogRequest.fulfilled, (state, action) => {
        const i = state.requests.findIndex((r) => r.id === action.payload.id);
        if (i >= 0) {
          state.requests[i] = action.payload;
        }
      })
      .addCase(fetchDogRequestMessages.fulfilled, (state, action) => {
        const { requestId, messages } = action.payload;
        const ids = new Set(messages.map((m) => m.id));
        const newest = messages.length ? messages[messages.length - 1].createdAt : '';
        const extra = (state.messages[requestId] ?? []).filter(
          (m) => !ids.has(m.id) && (m.pending || m.createdAt > newest),
        );
        state.messages[requestId] = [...messages, ...extra];
      })
      .addCase(sendDogRequestMessage.pending, (state, action) => {
        const { requestId, content, type, sender } = action.meta.arg;
        if (!sender) {
          return;
        }
        if (!state.messages[requestId]) {
          state.messages[requestId] = [];
        }
        state.messages[requestId].push({
          id: `pending-${action.meta.requestId}`,
          roomId: requestId,
          senderId: sender.id,
          senderName: sender.name,
          content,
          type,
          createdAt: new Date().toISOString(),
          pending: true,
        });
      })
      .addCase(sendDogRequestMessage.fulfilled, (state, action) => {
        const { requestId, message } = action.payload;
        const list = state.messages[requestId] ?? (state.messages[requestId] = []);
        const at = list.findIndex((m) => m.id === `pending-${action.meta.requestId}`);
        if (list.some((m) => m.id === message.id)) {
          if (at >= 0) {
            list.splice(at, 1);
          }
        } else if (at >= 0) {
          list[at] = message;
        } else {
          list.push(message);
        }
        const request = state.requests.find((r) => r.id === requestId);
        if (request) {
          request.lastMessage = message.type === 'image' ? '📷 Photo' : message.content;
          request.lastMessageAt = message.createdAt;
        }
      })
      .addCase(sendDogRequestMessage.rejected, (state, action) => {
        const { requestId } = action.meta.arg;
        state.messages[requestId] = (state.messages[requestId] ?? []).filter(
          (m) => m.id !== `pending-${action.meta.requestId}`,
        );
      })
      .addCase(markDogRequestRead.fulfilled, (state, action) => {
        const request = state.requests.find((r) => r.id === action.payload);
        if (request) {
          request.unread = 0;
        }
      });
  },
});

export const { setActiveRequest, receiveDogRequestMessage } = shelterRequestsSlice.actions;
export default shelterRequestsSlice.reducer;
