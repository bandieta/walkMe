import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../../utils/env';

export const apiClient = axios.create({ baseURL: ENV.API_BASE_URL, timeout: 10000 });

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type Tokens = { token: string; refreshToken: string };

// The store registers these (see store/index.ts) — importing the store here would be a require cycle.
const sessionHooks: { onTokensRefreshed?: (tokens: Tokens) => void; onSessionExpired?: () => void } = {};
export function registerSessionHooks(hooks: typeof sessionHooks) {
  Object.assign(sessionHooks, hooks);
}

type RefreshOutcome = { token: string } | 'invalid' | 'unreachable';

async function refreshAccessToken(): Promise<RefreshOutcome> {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (!refreshToken) return 'invalid';
  try {
    // A bare axios call: going through apiClient would re-enter this interceptor on failure.
    const res = await axios.post(`${ENV.API_BASE_URL}/auth/refresh`, { refreshToken }, { timeout: 10000 });
    const next: Tokens = { token: res.data.accessToken, refreshToken: res.data.refreshToken };
    await AsyncStorage.multiSet([['accessToken', next.token], ['refreshToken', next.refreshToken]]);
    sessionHooks.onTokensRefreshed?.(next);
    return { token: next.token };
  } catch (err) {
    // Only a server that answered "no" ends the session — being offline must not sign anyone out.
    return (err as AxiosError).response ? 'invalid' : 'unreachable';
  }
}

// Screens fire several requests at once; they all wait on one refresh instead of racing to rotate the token.
let inFlightRefresh: Promise<RefreshOutcome> | null = null;

async function expireSession() {
  await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
  sessionHooks.onSessionExpired?.();
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: { code?: string } }>) => {
    const status = error.response?.status;
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    if (status === 403 && error.response?.data?.error?.code === 'ACCOUNT_SUSPENDED') {
      await expireSession();
    } else if (status === 401 && original && !original._retried && !original.url?.startsWith('/auth/')) {
      inFlightRefresh ??= refreshAccessToken().finally(() => {
        inFlightRefresh = null;
      });
      const outcome = await inFlightRefresh;
      if (typeof outcome === 'object') {
        original._retried = true;
        original.headers.Authorization = `Bearer ${outcome.token}`;
        return apiClient(original);
      }
      if (outcome === 'invalid') await expireSession();
    }
    return Promise.reject(error);
  },
);
