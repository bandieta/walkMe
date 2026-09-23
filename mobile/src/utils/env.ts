// Mobile environment configuration
// Replace values before running.
//
// 10.0.2.2 is how the Android emulator reaches the host machine's localhost
// (see KNOWLEDGE.md's dev environment notes). iOS simulator can use
// localhost directly; a physical device needs your machine's LAN IP.
import { Platform } from 'react-native';

const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const ENV = {
  API_BASE_URL: `http://${DEV_HOST}:4000/api/v1`,
  SOCKET_URL: `http://${DEV_HOST}:4000`,
  GOOGLE_MAPS_API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY',
};
