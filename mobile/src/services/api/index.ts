// Real API layer backed by the walkMe server (see server/README.md).
// Every function here mirrors the shape the mock service used to return
// (an object with a `.data` field) so the Redux slices that were built
// against the mocks keep working unchanged.
import { apiClient } from './client';

export const authApi = {
  socialLogin: (provider: 'google' | 'facebook' | 'apple', token: string, displayName?: string) =>
    apiClient.post('/auth/social', { provider, token, displayName }),
  devLogin: (displayName: string) => apiClient.post('/auth/dev-login', { displayName }),
  refresh: (refreshToken: string) => apiClient.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken: string) => apiClient.post('/auth/logout', { refreshToken }),
};

export const usersApi = {
  getMe: () => apiClient.get('/users/me'),
  getProfile: async (userId: string) => {
    const [user, dogs] = await Promise.all([
      apiClient.get(`/users/${userId}`),
      apiClient.get(`/users/${userId}/dogs`),
    ]);
    return { ...user, data: { ...user.data, dogs: dogs.data } };
  },
  updateProfile: (data: Record<string, unknown>) => apiClient.patch('/users/me', data),
  updateFcmToken: (token?: string) => apiClient.post('/users/me/fcm-token', { token }),
  getMyDogs: () => apiClient.get('/users/me/dogs'),
  getDogsByOwner: (ownerId: string) => apiClient.get(`/users/${ownerId}/dogs`),
  createDog: (data: Record<string, unknown>) => apiClient.post('/dogs', data),
  updateDog: (dogId: string, data: Record<string, unknown>) => apiClient.patch(`/dogs/${dogId}`, data),
  deleteDog: (dogId: string) => apiClient.delete(`/dogs/${dogId}`),
};

export const walksApi = {
  list: (params?: { lat?: number; lng?: number; radiusKm?: number }) => apiClient.get('/walks', { params }),
  getById: (id: string) => apiClient.get(`/walks/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/walks', data),
  join: (id: string) => apiClient.post(`/walks/${id}/join`),
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

export const chatApi = {
  getRooms: () => apiClient.get('/chat/rooms'),
  getMessages: (roomId: string) => apiClient.get(`/chat/${roomId}/messages`),
  sendMessage: (roomId: string, content: string) => apiClient.post(`/chat/${roomId}/messages`, { content }),
};

export const matchesApi = {
  getAll: () => apiClient.get('/matches'),
  getMessages: (matchId: string) => apiClient.get(`/matches/${matchId}/messages`),
  sendMessage: (matchId: string, content: string) => apiClient.post(`/matches/${matchId}/messages`, { content }),
  markRead: (matchId: string) => apiClient.post(`/matches/${matchId}/read`),
  getSwipeDeck: () => apiClient.get('/discover/deck'),
  swipeRight: (userId: string) => apiClient.post(`/discover/${userId}/swipe-right`),
  swipeLeft: (userId: string) => apiClient.post(`/discover/${userId}/swipe-left`),
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
    return apiClient.post('/storage/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};
