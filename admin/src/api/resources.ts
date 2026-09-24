import { api } from './client';
import {
  AdminDog,
  AdminEventDetail,
  AdminEventRow,
  AdminMatch,
  AdminMe,
  AdminMessage,
  AdminPlace,
  AdminUpload,
  AdminUserDetail,
  AdminUserRow,
  AdminWalkDetail,
  AdminWalkRow,
  AuditEntry,
  DashboardStats,
  Page,
} from './types';

export const auth = {
  login: (email: string, password: string) => api.post<{ accessToken: string; admin: AdminMe }>('/auth/login', { email, password }),
  me: () => api.get<AdminMe>('/auth/me'),
};

export const dashboard = {
  stats: () => api.get<DashboardStats>('/stats'),
};

export const users = {
  list: (params: Record<string, unknown>) => api.get<Page<AdminUserRow>>('/users', { params }),
  get: (id: string) => api.get<AdminUserDetail>(`/users/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.patch<AdminUserDetail>(`/users/${id}`, data),
  remove: (id: string) => api.delete(`/users/${id}`),
};

export const dogs = {
  list: (params: Record<string, unknown>) => api.get<Page<AdminDog>>('/dogs', { params }),
  remove: (id: string) => api.delete(`/dogs/${id}`),
};

export const walks = {
  list: (params: Record<string, unknown>) => api.get<Page<AdminWalkRow>>('/walks', { params }),
  get: (id: string) => api.get<AdminWalkDetail>(`/walks/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/walks/${id}`, data),
  remove: (id: string) => api.delete(`/walks/${id}`),
};

export const events = {
  list: (params: Record<string, unknown>) => api.get<Page<AdminEventRow>>('/events', { params }),
  get: (id: string) => api.get<AdminEventDetail>(`/events/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/events/${id}`, data),
  remove: (id: string) => api.delete(`/events/${id}`),
};

export const places = {
  list: (params: Record<string, unknown>) => api.get<Page<AdminPlace>>('/places', { params }),
  create: (data: Record<string, unknown>) => api.post<AdminPlace>('/places', data),
  update: (id: string, data: Record<string, unknown>) => api.patch<AdminPlace>(`/places/${id}`, data),
  remove: (id: string) => api.delete(`/places/${id}`),
};

export const messages = {
  list: (params: Record<string, unknown>) => api.get<Page<AdminMessage>>('/messages', { params }),
  remove: (id: string) => api.delete(`/messages/${id}`),
};

export const matches = {
  list: (params: Record<string, unknown>) => api.get<Page<AdminMatch>>('/matches', { params }),
  remove: (id: string) => api.delete(`/matches/${id}`),
};

export const uploads = {
  list: () => api.get<AdminUpload[]>('/uploads'),
  remove: (name: string) => api.delete(`/uploads/${encodeURIComponent(name)}`),
};

export const audit = {
  list: (params: Record<string, unknown>) => api.get<Page<AuditEntry>>('/audit', { params }),
};

export const admins = {
  list: () => api.get<AdminMe[]>('/admins'),
  create: (data: Record<string, unknown>) => api.post<AdminMe>('/admins', data),
  remove: (id: string) => api.delete(`/admins/${id}`),
};
