// Mobile environment configuration
// Replace values before running.
//
// Points at the public walkMe server (nginx on dagora.tech proxies /walkMe/ to
// the API on port 4000), so it works from simulators, emulators and physical
// devices on any network.
// To use a server on your own machine instead, set SERVER_ORIGIN to
// 'http://10.0.2.2:4000' on the Android emulator (see KNOWLEDGE.md's dev
// environment notes), 'http://localhost:4000' on the iOS simulator, or your LAN
// IP on a physical device, and set SERVER_PATH to ''.
const SERVER_ORIGIN = 'https://dagora.tech';
const SERVER_PATH = '/walkMe';

export const ENV = {
  API_BASE_URL: `${SERVER_ORIGIN}${SERVER_PATH}/api/v1`,
  // Base for server-relative media paths like `/uploads/x.jpg`.
  MEDIA_BASE_URL: `${SERVER_ORIGIN}${SERVER_PATH}`,
  // Socket.io reads the URL path as the namespace (`/chat`), so the proxy
  // prefix has to go in the engine path instead.
  SOCKET_URL: SERVER_ORIGIN,
  SOCKET_PATH: `${SERVER_PATH}/socket.io`,
  GOOGLE_MAPS_API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY',
};
