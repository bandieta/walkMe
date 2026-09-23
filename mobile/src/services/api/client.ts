import axios from 'axios';
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

// Kept intentionally simple for the first version: on a 401 we just clear
// the session and let the auth guard in AppNavigator send the user back to
// LoginScreen. Silent token refresh (using the stored refreshToken) is a
// natural next step once this is running for real users.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
    }
    return Promise.reject(error);
  },
);
