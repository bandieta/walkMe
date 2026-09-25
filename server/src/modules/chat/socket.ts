import { Server, Socket } from 'socket.io';
import { authenticateAccessToken } from '../../middleware/auth';
import { prisma } from '../../lib/prisma';
import * as chatService from './service';

interface AuthedSocket extends Socket {
  data: { userId: string };
}

// Matches the mobile client and KNOWLEDGE.md: clients connect to `<host>/chat`.
export const CHAT_NAMESPACE = '/chat';

/**
 * Every room (walk id or match id) this user is part of, so a fresh connection can be joined to all of them at
 * once — otherwise a message sent while the recipient has no matching chat screen open would never reach their
 * socket at all, since Socket.io rooms only exist for sockets that explicitly joined them.
 */
async function roomIdsForUser(userId: string): Promise<string[]> {
  const [walks, matches, dogRequests] = await Promise.all([
    prisma.walkParticipant.findMany({ where: { userId }, select: { walkId: true } }),
    prisma.match.findMany({ where: { OR: [{ userAId: userId }, { userBId: userId }] }, select: { id: true } }),
    prisma.dogWalkRequest.findMany({ where: { OR: [{ requesterId: userId }, { shelterId: userId }] }, select: { id: true } }),
  ]);
  return [...walks.map((w) => w.walkId), ...matches.map((m) => m.id), ...dogRequests.map((r) => r.id)];
}

export function registerChatGateway(server: Server) {
  const io = server.of(CHAT_NAMESPACE);

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Missing auth token'));
    authenticateAccessToken(token)
      .then((result) => {
        if (!result.ok) return next(new Error(result.message));
        (socket as AuthedSocket).data.userId = result.userId;
        next();
      })
      .catch(() => next(new Error('Authentication failed')));
  });

  io.on('connection', (socket: AuthedSocket) => {
    // A room named after the user's own id, so notifications/socket.ts can push straight to them regardless
    // of which chat rooms they're currently in — see emitNotification().
    socket.join(socket.data.userId);

    roomIdsForUser(socket.data.userId)
      .then((roomIds) => roomIds.forEach((id) => socket.join(id)))
      .catch((err) => console.error('[chat] auto-join failed', err));

    // Every handler below takes untrusted client input and runs async work: Node exits on an unhandled
    // rejection, so a malformed or unauthorised event must be dropped here rather than allowed to throw.
    const guarded = <T>(handler: (payload: T) => Promise<void>) => (payload: T) => {
      handler(payload ?? ({} as T)).catch((err) => console.error('[chat] socket handler failed', err));
    };
    const isId = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

    socket.on('chat:room:join', guarded(async ({ walkId }: { walkId?: unknown }) => {
      if (isId(walkId) && (await chatService.canJoinRoom(walkId, socket.data.userId))) socket.join(walkId);
    }));

    socket.on('chat:room:leave', ({ walkId }: { walkId?: unknown } = {}) => {
      if (isId(walkId) && walkId !== socket.data.userId) socket.leave(walkId);
    });

    socket.on('chat:message:send', guarded(async ({ walkId, content }: { walkId?: unknown; content?: unknown }) => {
      if (!isId(walkId) || typeof content !== 'string' || !content.trim() || content.length > 2000) return;
      if (!(await chatService.isWalkMember(walkId, socket.data.userId))) return;
      const message = await chatService.sendMessage(walkId, socket.data.userId, content);
      io.to(walkId).emit('chat:message:receive', message);
    }));

    socket.on('chat:typing:start', ({ roomId }: { roomId?: unknown } = {}) => {
      if (isId(roomId) && socket.rooms.has(roomId)) {
        socket.to(roomId).emit('chat:typing:update', { roomId, userId: socket.data.userId, isTyping: true });
      }
    });

    socket.on('chat:typing:stop', ({ roomId }: { roomId?: unknown } = {}) => {
      if (isId(roomId) && socket.rooms.has(roomId)) {
        socket.to(roomId).emit('chat:typing:update', { roomId, userId: socket.data.userId, isTyping: false });
      }
    });

    // Live position is shared with the one walk it's for — never fanned out to DMs or shelter threads.
    socket.on('location:update', guarded(async (p: { walkId?: unknown; lat?: unknown; lng?: unknown; latitude?: unknown; longitude?: unknown }) => {
      const lat = p.lat ?? p.latitude;
      const lng = p.lng ?? p.longitude;
      if (!isId(p.walkId) || typeof lat !== 'number' || typeof lng !== 'number') return;
      if (!(await chatService.isWalkMember(p.walkId, socket.data.userId))) return;
      socket.to(p.walkId).emit('location:walk:update', { walkId: p.walkId, userId: socket.data.userId, lat, lng });
    }));
  });
}
