import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { notificationsApi, NotificationCategory } from '../../services/api';

export type NotificationType =
  | 'match'
  | 'message'
  | 'walk_joined'
  | 'walk_left'
  | 'walk_nearby'
  | 'event_joined'
  | 'shelter_request'
  | 'shelter_accepted'
  | 'shelter_declined';

export interface NotifyTarget {
  tab: 'MapTab' | 'ChatTab' | 'ProfileTab';
  screen: string;
  params?: Record<string, unknown>;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: { params?: Record<string, string>; target?: NotifyTarget };
  read: boolean;
  createdAt: string;
}

export type NotificationPreferences = Record<NotificationCategory, boolean>;

const DEFAULT_PREFERENCES: NotificationPreferences = {
  matches: true,
  messages: true,
  walks: true,
  events: true,
  shelterRequests: true,
  nearby: true,
};

interface NotificationsState {
  items: AppNotification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  preferences: DEFAULT_PREFERENCES,
  loading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk('notifications/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await notificationsApi.list();
    return res.data.items as AppNotification[];
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.error?.message ?? 'Failed to load notifications');
  }
});

export const fetchUnreadCount = createAsyncThunk('notifications/fetchUnreadCount', async () => {
  const res = await notificationsApi.unreadCount();
  return res.data.count as number;
});

export const markNotificationRead = createAsyncThunk('notifications/markRead', async (id: string) => {
  await notificationsApi.markRead(id);
  return id;
});

export const markAllNotificationsRead = createAsyncThunk('notifications/markAllRead', async () => {
  await notificationsApi.markAllRead();
});

export const fetchNotificationPreferences = createAsyncThunk('notifications/fetchPreferences', async () => {
  const res = await notificationsApi.getPreferences();
  return res.data as NotificationPreferences;
});

export const updateNotificationPreferences = createAsyncThunk(
  'notifications/updatePreferences',
  async (patch: Partial<NotificationPreferences>, { rejectWithValue }) => {
    try {
      const res = await notificationsApi.updatePreferences(patch);
      return res.data as NotificationPreferences;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.error?.message ?? 'Failed to update preferences');
    }
  },
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    /** A `notification:new` socket push — prepend it and bump the badge, unless we've already seen this id. */
    receiveNotification(state, action: PayloadAction<AppNotification>) {
      if (state.items.some((n) => n.id === action.payload.id)) return;
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchNotifications.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchNotifications.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => { state.unreadCount = action.payload; })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const n = state.items.find((x) => x.id === action.payload);
        if (n && !n.read) { n.read = true; state.unreadCount = Math.max(0, state.unreadCount - 1); }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((n) => { n.read = true; });
        state.unreadCount = 0;
      })
      .addCase(fetchNotificationPreferences.fulfilled, (state, action) => { state.preferences = action.payload; })
      .addCase(updateNotificationPreferences.fulfilled, (state, action) => { state.preferences = action.payload; });
  },
});

export const { receiveNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
