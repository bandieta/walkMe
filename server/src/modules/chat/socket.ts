import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../../lib/jwt';
import * as chatService from './service';

interface AuthedSocket extends Socket {
  data: { userId: string };
}

export function registerChatGateway(io: Server) {
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

    socket.on('location:update', ({ lat, lng }: { lat: number; lng: number }) => {
      // Broadcast to rooms this socket has joined (rooms include the socket's own id — skip it).
      for (const room of socket.rooms) {
        if (room === socket.id) continue;
        socket.to(room).emit('location:walk:update', { userId: socket.data.userId, lat, lng });
      }
    });
  });
}
