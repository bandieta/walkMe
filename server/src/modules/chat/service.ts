import { prisma } from '../../lib/prisma';
import * as notificationsService from '../notifications/service';
import { toMessageDto } from './serialize';

export async function getRoomsForUser(userId: string) {
  const walks = await prisma.walk.findMany({
    where: { participants: { some: { userId } } },
    orderBy: { scheduledAt: 'asc' },
  });

  return Promise.all(
    walks.map(async (walk) => {
      const lastMessage = await prisma.message.findFirst({
        where: { roomId: walk.id },
        orderBy: { createdAt: 'desc' },
        include: { sender: true },
      });
      return {
        walkId: walk.id,
        walkTitle: walk.title,
        type: 'group' as const,
        unreadCount: 0,
        // Additive: the chat list shows an icon by category and "Live now" / "In 2 h" by status, and hides ended walks.
        walkStatus: walk.status,
        walkCategory: walk.category,
        scheduledAt: walk.scheduledAt.toISOString(),
        lastMessage: lastMessage ? toMessageDto(lastMessage) : null,
      };
    }),
  );
}

export async function getMessages(roomId: string) {
  const messages = await prisma.message.findMany({
    where: { roomId },
    orderBy: { createdAt: 'asc' },
    include: { sender: true },
  });
  return messages.map(toMessageDto);
}

export async function sendMessage(
  roomId: string,
  senderId: string,
  content: string,
  type: 'text' | 'image' | 'system' = 'text',
) {
  const walk = await prisma.walk.findUnique({ where: { id: roomId }, include: { participants: true } });
  const message = await prisma.message.create({
    data: { roomId, senderId, content, type, walkId: walk ? roomId : null },
    include: { sender: true },
  });
  if (walk && type !== 'system') {
    const recipientIds = walk.participants.map((p) => p.userId).filter((id) => id !== senderId);
    for (const recipientId of recipientIds) {
      await notificationsService.notify(
        recipientId,
        'message',
        { name: message.sender.displayName, preview: content.length > 80 ? `${content.slice(0, 80)}…` : content },
        { tab: 'ChatTab', screen: 'WalkChat', params: { walkId: roomId, walkTitle: walk.title } },
      );
    }
  }
  return toMessageDto(message);
}
