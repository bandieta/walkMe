import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../../lib/jwt';
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
  const [walks, matches] = await Promise.all([
    prisma.walkParticipant.findMany({ where: { userId }, select: { walkId: true } }),
    prisma.match.findMany({ where: { OR: [{ userAId: userId }, { userBId: userId }] }, select: { id: true } }),
  ]);
  return [...walks.map((w) => w.walkId), ...matches.map((m) => m.id)];
}

export function registerChatGateway(server: Server) {
  const io = server.of(CHAT_NAMESPACE);

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Missing auth token'));
    try {
      const payload = verifyAccessToken(token);
      (socket as AuthedSocket).data.userId = payload.sub;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: AuthedSocket) => {
    roomIdsForUser(socket.data.userId).then((roomIds) => {
      roomIds.forEach((id) => socket.join(id));
    });

    socket.on('chat:room:join', ({ walkId }: { walkId: string }) => {
      socket.join(walkId);
    });

    socket.on('chat:room:leave', ({ walkId }: { walkId: string }) => {
      socket.leave(walkId);
    });

    socket.on('chat:message:send', async ({ walkId, content }: { walkId: string; content: string }) => {
      const message = await chatService.sendMessage(walkId, socket.data.userId, content);
      io.to(walkId).emit('chat:message:receive', message);
    });

    socket.on('chat:typing:start', ({ roomId }: { roomId: string }) => {
      socket.to(roomId).emit('chat:typing:update', { roomId, userId: socket.data.userId, isTyping: true });
    });

    socket.on('chat:typing:stop', ({ roomId }: { roomId: string }) => {
      socket.to(roomId).emit('chat:typing:update', { roomId, userId: socket.data.userId, isTyping: false });
    });

    socket.on('location:update', ({ lat, lng }: { lat: number; lng: number }) => {
      // Broadcast to rooms this socket has joined (rooms include the socket's own id — skip it).
      for (const room of socket.rooms) {
        if (room === socket.id) continue;
        socket.to(room).emit('location:walk:update', { userId: socket.data.userId, lat, lng });
      }
    });
  });
}
