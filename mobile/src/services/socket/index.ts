import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../../utils/env';
import { SOCKET_EVENTS } from '@walkme/shared';

let socket: Socket | null = null;

export const getSocket = (token: string): Socket => {
  if (!socket) {
    socket = io(`${ENV.SOCKET_URL}/chat`, {
      path: ENV.SOCKET_PATH,
      // Evaluated on every (re)connect, so a token the API client silently refreshed is picked up.
      auth: (cb) => {
        AsyncStorage.getItem('accessToken')
          .then((stored) => cb({ token: stored ?? token }))
          .catch(() => cb({ token }));
      },
      transports: ['websocket'],
      autoConnect: false,
    });
  }
  return socket;
};

export const connectSocket = (token: string) => {
  const s = getSocket(token);
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const joinWalkRoom = (walkId: string) => {
  socket?.emit(SOCKET_EVENTS.JOIN_WALK_ROOM, { walkId });
};

export const leaveWalkRoom = (walkId: string) => {
  socket?.emit(SOCKET_EVENTS.LEAVE_WALK_ROOM, { walkId });
};

export const sendTypingStart = (roomId: string) => {
  socket?.emit('chat:typing:start', { roomId });
};

export const sendTypingStop = (roomId: string) => {
  socket?.emit('chat:typing:stop', { roomId });
};

export const sendMessage = (
  walkId: string,
  senderId: string,
  content: string,
  type: 'text' | 'image' | 'location' = 'text',
) => {
  socket?.emit(SOCKET_EVENTS.SEND_MESSAGE, { walkId, senderId, content, type });
};

export const sendLocationUpdate = (
  walkId: string,
  userId: string,
  latitude: number,
  longitude: number,
) => {
  socket?.emit(SOCKET_EVENTS.UPDATE_LOCATION, { walkId, userId, latitude, longitude });
};
