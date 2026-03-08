import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../utils/env';

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 10_000,
});

// Attach JWT token to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (email: string, displayName: string, password: string) =>
    apiClient.post('/auth/register', { email, displayName, password }),

  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),

  firebaseLogin: (idToken: string) =>
    apiClient.post('/auth/firebase', { idToken }),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersApi = {
  getMe: () => apiClient.get('/users/me'),
  updateProfile: (data: { displayName?: string; photoUrl?: string }) =>
    apiClient.patch('/users/me', data),
  updateFcmToken: (fcmToken: string) =>
    apiClient.patch('/users/me/fcm-token', { fcmToken }),
};

// ─── Walks ────────────────────────────────────────────────────────────────────

export const walksApi = {
  create: (data: {
    title: string;
    description?: string;
    meetingLat: number;
    meetingLng: number;
    scheduledAt: string;
    maxParticipants?: number;
  }) => apiClient.post('/walks', data),

  list: (lat?: number, lng?: number, radiusKm?: number) =>
    apiClient.get('/walks', { params: { lat, lng, radiusKm } }),

  getById: (id: string) => apiClient.get(`/walks/${id}`),
  join: (id: string) => apiClient.post(`/walks/${id}/join`),
  leave: (id: string) => apiClient.post(`/walks/${id}/leave`),
  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/walks/${id}/status`, { status }),
};

// ─── Chat ─────────────────────────────────────────────────────────────────────

export const chatApi = {
  getMessages: (walkId: string, limit = 50, offset = 0) =>
    apiClient.get(`/chat/${walkId}/messages`, { params: { limit, offset } }),
};
