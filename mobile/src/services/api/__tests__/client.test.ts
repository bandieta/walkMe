import axios, { AxiosAdapter, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, registerSessionHooks } from '../client';

type Handler = (config: InternalAxiosRequestConfig) => { status: number; data?: unknown } | 'offline';

let handler: Handler;
const calls: string[] = [];

const adapter: AxiosAdapter = async (config) => {
  calls.push(`${config.method?.toUpperCase()} ${config.url?.replace(/^https?:\/\/[^/]+\/walkMe\/api\/v1/, '')}`);
  const result = handler(config);
  if (result === 'offline') throw new AxiosError('Network Error', 'ERR_NETWORK', config);
  const response: AxiosResponse = { data: result.data ?? {}, status: result.status, statusText: '', headers: {}, config };
  if (result.status >= 400) throw new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, null, response);
  return response;
};
apiClient.defaults.adapter = adapter;
axios.defaults.adapter = adapter;

const onTokensRefreshed = jest.fn();
const onSessionExpired = jest.fn();
registerSessionHooks({ onTokensRefreshed, onSessionExpired });

const authOf = (config: InternalAxiosRequestConfig) => String(config.headers?.Authorization ?? '');

beforeEach(async () => {
  calls.length = 0;
  onTokensRefreshed.mockClear();
  onSessionExpired.mockClear();
  await AsyncStorage.clear();
  await AsyncStorage.multiSet([['accessToken', 'old-access'], ['refreshToken', 'old-refresh']]);
});

describe('api client session handling', () => {
  it('silently refreshes an expired access token and retries the request once', async () => {
    handler = (config) => {
      if (config.url?.endsWith('/auth/refresh')) return { status: 200, data: { accessToken: 'new-access', refreshToken: 'new-refresh' } };
      return authOf(config) === 'Bearer new-access' ? { status: 200, data: { ok: true } } : { status: 401 };
    };

    const res = await apiClient.get('/users/me');

    expect(res.data).toEqual({ ok: true });
    expect(await AsyncStorage.getItem('accessToken')).toBe('new-access');
    expect(await AsyncStorage.getItem('refreshToken')).toBe('new-refresh');
    expect(onTokensRefreshed).toHaveBeenCalledWith({ token: 'new-access', refreshToken: 'new-refresh' });
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it('shares one refresh between requests that fail at the same time', async () => {
    handler = (config) => {
      if (config.url?.endsWith('/auth/refresh')) return { status: 200, data: { accessToken: 'new-access', refreshToken: 'new-refresh' } };
      return authOf(config) === 'Bearer new-access' ? { status: 200 } : { status: 401 };
    };

    await Promise.all([apiClient.get('/walks'), apiClient.get('/events'), apiClient.get('/users/me')]);

    expect(calls.filter((c) => c.endsWith('/auth/refresh'))).toHaveLength(1);
  });

  it('ends the session when the server rejects the refresh token', async () => {
    handler = () => ({ status: 401 });

    await expect(apiClient.get('/users/me')).rejects.toBeDefined();

    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(await AsyncStorage.getItem('accessToken')).toBeNull();
    expect(await AsyncStorage.getItem('refreshToken')).toBeNull();
  });

  it('keeps the user signed in when the refresh could not reach the server', async () => {
    handler = (config) => (config.url?.endsWith('/auth/refresh') ? 'offline' : { status: 401 });

    await expect(apiClient.get('/users/me')).rejects.toBeDefined();

    expect(onSessionExpired).not.toHaveBeenCalled();
    expect(await AsyncStorage.getItem('refreshToken')).toBe('old-refresh');
  });

  it('does not try to refresh on a failed sign-in call', async () => {
    handler = () => ({ status: 401 });

    await expect(apiClient.post('/auth/dev-login', {})).rejects.toBeDefined();

    expect(calls).toEqual(['POST /auth/dev-login']);
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it('signs out a suspended account', async () => {
    handler = () => ({ status: 403, data: { error: { code: 'ACCOUNT_SUSPENDED' } } });

    await expect(apiClient.get('/users/me')).rejects.toBeDefined();

    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });
});
