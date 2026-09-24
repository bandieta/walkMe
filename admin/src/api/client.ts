import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1/admin';

export const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('walkme_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A 401 means the admin session is missing or expired — bounce to login.
// (The login request itself never gets here with a stale token attached.)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && !err.config?.url?.endsWith('/auth/login')) {
      localStorage.removeItem('walkme_admin_token');
      if (!location.pathname.endsWith('/login')) location.assign(`${import.meta.env.BASE_URL}login`);
    }
    return Promise.reject(err);
  },
);

export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.message ?? err.message ?? fallback;
  }
  return fallback;
}
