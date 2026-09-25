import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';
import * as notificationsService from '../notifications/service';
import { toMessageDto } from './serialize';

export async function isWalkMember(walkId: string, userId: string) {
  const row = await prisma.walkParticipant.findUnique({ where: { walkId_userId: { walkId, userId } } });
  return !!row;
}

/** The generic /chat endpoints serve walk group rooms only — DMs and shelter threads have their own guarded routes. */
async function assertWalkMember(walkId: string, userId: string) {
  if (!(await isWalkMember(walkId, userId))) {
    throw new HttpError(403, 'FORBIDDEN', 'You are not part of this walk');
  }
}

/** Any room a socket may subscribe to: a walk it joined, one of its matches, or one of its shelter request threads. */
export async function canJoinRoom(roomId: string, userId: string) {
  const [walk, match, dogRequest] = await Promise.all([
    isWalkMember(roomId, userId),
    prisma.match.findFirst({ where: { id: roomId, OR: [{ userAId: userId }, { userBId: userId }] }, select: { id: true } }),
    prisma.dogWalkRequest.findFirst({
      where: { id: roomId, OR: [{ requesterId: userId }, { shelterId: userId }] },
      select: { id: true },
    }),
  ]);
  return walk || !!match || !!dogRequest;
}

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

export async function getMessages(roomId: string, viewerId: string) {
  await assertWalkMember(roomId, viewerId);
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
  await assertWalkMember(roomId, senderId);
  const walk = await prisma.walk.findUniqueOrThrow({ where: { id: roomId }, include: { participants: true } });
  const message = await prisma.message.create({
    data: { roomId, senderId, content, type, walkId: roomId },
    include: { sender: true },
  });
  if (type !== 'system') {
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
