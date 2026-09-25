import { Server } from 'socket.io';
import { CHAT_NAMESPACE } from '../chat/socket';

// Set once at server startup (see src/index.ts) — kept as a module-level reference rather than threaded
// through every service function, the same trade-off routes already make with `req.app.get('io')`. Tests that
// build the app with supertest and never call setNotificationsIO simply never emit, which is fine: they only
// assert on the persisted Notification row.
let ioRef: Server | undefined;

export function setNotificationsIO(io: Server) {
  ioRef = io;
}

/** Every socket for this user already sits in a room named after their own id — see chat/socket.ts. */
export function emitNotification(userId: string, payload: unknown) {
  ioRef?.of(CHAT_NAMESPACE).to(userId).emit('notification:new', payload);
}
