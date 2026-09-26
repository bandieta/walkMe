// Real API layer backed by the walkMe server (see server/README.md).
// Every function here mirrors the shape the mock service used to return
// (an object with a `.data` field) so the Redux slices that were built
// against the mocks keep working unchanged.
import { apiClient } from './client';

export type NotificationCategory =
  'matches' | 'messages' | 'walks' | 'events' | 'shelterRequests' | 'nearby';

export const authApi = {
  socialLogin: (
    provider: 'google' | 'facebook' | 'apple',
    token: string,
    displayName?: string,
    accountType?: 'person' | 'shelter',
    shelterConfirmed?: boolean,
  ) =>
    apiClient.post('/auth/social', { provider, token, displayName, accountType, shelterConfirmed }),
  devLogin: (displayName: string) => apiClient.post('/auth/dev-login', { displayName }),
  refresh: (refreshToken: string) => apiClient.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken: string) => apiClient.post('/auth/logout', { refreshToken }),
  emailStart: (email: string) => apiClient.post('/auth/email/start', { email }),
  emailVerify: (
    email: string,
    code: string,
    displayName?: string,
    accountType?: 'person' | 'shelter',
    shelterConfirmed?: boolean,
  ) =>
    apiClient.post('/auth/email/verify', {
      email,
      code,
      displayName,
      accountType,
      shelterConfirmed,
    }),
};

export const usersApi = {
  getMe: () => apiClient.get('/users/me'),
  getStats: () => apiClient.get('/users/me/stats'),
  getProfile: async (userId: string) => {
    const [user, dogs, stats] = await Promise.all([
      apiClient.get(`/users/${userId}`),
      apiClient.get(`/users/${userId}/dogs`),
      apiClient.get(`/users/${userId}/stats`),
    ]);
    return { ...user, data: { ...user.data, dogs: dogs.data, stats: stats.data } };
  },
  updateProfile: (data: Record<string, unknown>) => apiClient.patch('/users/me', data),
  updateFcmToken: (token?: string) => apiClient.post('/users/me/fcm-token', { token }),
  getMyDogs: () => apiClient.get('/users/me/dogs'),
  getDogsByOwner: (ownerId: string) => apiClient.get(`/users/${ownerId}/dogs`),
  createDog: (data: Record<string, unknown>) => apiClient.post('/dogs', data),
  updateDog: (dogId: string, data: Record<string, unknown>) =>
    apiClient.patch(`/dogs/${dogId}`, data),
  deleteDog: (dogId: string) => apiClient.delete(`/dogs/${dogId}`),
  likeDog: (dogId: string) => apiClient.post(`/dogs/${dogId}/like`),
  getWalkableDogs: () => apiClient.get('/users/me/walkable-dogs'),
  deleteAccount: () => apiClient.delete('/users/me'),
};

export const blocksApi = {
  list: () => apiClient.get('/blocks'),
  block: (userId: string) => apiClient.put(`/blocks/${userId}`),
  unblock: (userId: string) => apiClient.delete(`/blocks/${userId}`),
};

export type ReportTargetType = 'user' | 'dog' | 'walk' | 'event' | 'message';
export type ReportReason =
  'harassment' | 'spam' | 'fake_profile' | 'inappropriate_content' | 'safety_concern' | 'other';

export const reportsApi = {
  create: (
    targetType: ReportTargetType,
    targetId: string,
    reason: ReportReason,
    details?: string,
  ) => apiClient.post('/reports', { targetType, targetId, reason, details }),
};

export const walksApi = {
  list: (params?: { lat?: number; lng?: number; radiusKm?: number }) =>
    apiClient.get('/walks', { params }),
  getById: (id: string) => apiClient.get(`/walks/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/walks', data),
  join: (id: string, dogId?: string) => apiClient.post(`/walks/${id}/join`, { dogId }),
  leave: (id: string) => apiClient.post(`/walks/${id}/leave`),
  updateStatus: (id: string, status: string) => apiClient.patch(`/walks/${id}/status`, { status }),
};

export const eventsApi = {
  list: () => apiClient.get('/events'),
  getById: (id: string) => apiClient.get(`/events/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/events', data),
  join: (id: string) => apiClient.post(`/events/${id}/join`),
  leave: (id: string) => apiClient.post(`/events/${id}/leave`),
};

export type MessageType = 'text' | 'image';

export const chatApi = {
  getRooms: () => apiClient.get('/chat/rooms'),
  getMessages: (roomId: string) => apiClient.get(`/chat/${roomId}/messages`),
  sendMessage: (roomId: string, content: string, type: MessageType = 'text') =>
    apiClient.post(`/chat/${roomId}/messages`, { content, type }),
};

export interface DeckFilters {
  energy?: 'Calm' | 'Balanced' | 'High';
  ageGroup?: 'Puppy' | 'Adult' | 'Senior';
  shelterOnly?: boolean;
  radiusKm?: number;
}

export const matchesApi = {
  getAll: () => apiClient.get('/matches'),
  getMessages: (matchId: string) => apiClient.get(`/matches/${matchId}/messages`),
  sendMessage: (matchId: string, content: string, type: MessageType = 'text') =>
    apiClient.post(`/matches/${matchId}/messages`, { content, type }),
  markRead: (matchId: string) => apiClient.post(`/matches/${matchId}/read`),
  unmatch: (matchId: string) => apiClient.delete(`/matches/${matchId}`),
  getSwipeDeck: (filters?: DeckFilters) => apiClient.get('/discover/deck', { params: filters }),
  swipeRight: (userId: string) => apiClient.post(`/discover/${userId}/swipe-right`),
  swipeLeft: (userId: string) => apiClient.post(`/discover/${userId}/swipe-left`),
  resetSwipes: () => apiClient.post('/discover/reset'),
};

export const shelterRequestsApi = {
  getAll: () => apiClient.get('/dog-requests'),
  accept: (id: string) => apiClient.post(`/dog-requests/${id}/accept`),
  decline: (id: string) => apiClient.post(`/dog-requests/${id}/decline`),
  getMessages: (id: string) => apiClient.get(`/dog-requests/${id}/messages`),
  sendMessage: (id: string, content: string, type: MessageType = 'text') =>
    apiClient.post(`/dog-requests/${id}/messages`, { content, type }),
  markRead: (id: string) => apiClient.post(`/dog-requests/${id}/read`),
};

export const notificationsApi = {
  list: (cursor?: string) =>
    apiClient.get('/notifications', { params: cursor ? { cursor } : undefined }),
  unreadCount: () => apiClient.get('/notifications/unread-count'),
  markRead: (id: string) => apiClient.post(`/notifications/${id}/read`),
  markAllRead: () => apiClient.post('/notifications/read-all'),
  getPreferences: () => apiClient.get('/notifications/preferences'),
  updatePreferences: (patch: Partial<Record<NotificationCategory, boolean>>) =>
    apiClient.put('/notifications/preferences', patch),
};

export const placesApi = {
  list: () => apiClient.get('/places'),
  getById: (id: string) => apiClient.get(`/places/${id}`),
};

export const storageApi = {
  upload: (file: { uri: string; name: string; type: string }) => {
    const form = new FormData();
    // React Native's FormData accepts this {uri,name,type} shape directly.
    form.append('file', file as unknown as Blob);
    return apiClient.post('/storage/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
