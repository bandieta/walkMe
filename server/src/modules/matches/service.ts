import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';
import { toPublicUser } from '../users/serialize';
import { toDogDto } from '../dogs/serialize';
import { toMessageDto } from '../chat/serialize';
import { orderedPair, otherUserId, toMatchDto } from './serialize';

async function getMatchOrThrow(matchId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) throw new HttpError(404, 'NOT_FOUND', 'Match not found');
  return match;
}

function assertParticipant(match: { userAId: string; userBId: string }, viewerId: string) {
  if (match.userAId !== viewerId && match.userBId !== viewerId) {
    throw new HttpError(403, 'FORBIDDEN', 'You are not part of this match');
  }
}

export async function getMatchesForUser(userId: string) {
  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    orderBy: { lastMessageAt: 'desc' },
  });
  const otherIds = matches.map((m) => otherUserId(m, userId));
  const otherUsers = await prisma.user.findMany({ where: { id: { in: otherIds } } });
  const byId = new Map(otherUsers.map((u) => [u.id, u]));
  return matches.map((m) => toMatchDto(m, userId, byId.get(otherUserId(m, userId))!));
}

export async function getMatchMessages(matchId: string, viewerId: string) {
  const match = await getMatchOrThrow(matchId);
  assertParticipant(match, viewerId);
  const messages = await prisma.message.findMany({
    where: { roomId: matchId },
    orderBy: { createdAt: 'asc' },
    include: { sender: true },
  });
  return messages.map(toMessageDto);
}

export async function sendMatchMessage(matchId: string, senderId: string, content: string) {
  const match = await getMatchOrThrow(matchId);
  assertParticipant(match, senderId);

  const message = await prisma.message.create({
    data: { roomId: matchId, senderId, content, type: 'text' },
    include: { sender: true },
  });

  const senderIsA = match.userAId === senderId;
  await prisma.match.update({
    where: { id: matchId },
    data: {
      lastMessage: content,
      lastMessageAt: new Date(),
      ...(senderIsA ? { unreadForB: { increment: 1 } } : { unreadForA: { increment: 1 } }),
    },
  });

  return toMessageDto(message);
}

export async function markMatchRead(matchId: string, viewerId: string) {
  const match = await getMatchOrThrow(matchId);
  assertParticipant(match, viewerId);
  const viewerIsA = match.userAId === viewerId;
  await prisma.match.update({
    where: { id: matchId },
    data: viewerIsA ? { unreadForA: 0 } : { unreadForB: 0 },
  });
}

export async function getSwipeDeck(userId: string) {
  const swiped = await prisma.swipe.findMany({ where: { fromUserId: userId }, select: { toUserId: true } });
  const swipedIds = new Set(swiped.map((s) => s.toUserId));
  const candidates = await prisma.user.findMany({
    where: { id: { not: userId, notIn: [...swipedIds] } },
    include: { dogs: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return candidates.map((c) => ({ ...toPublicUser(c), dogs: c.dogs.map(toDogDto) }));
}

export async function swipe(fromUserId: string, toUserId: string, direction: 'left' | 'right') {
  if (fromUserId === toUserId) {
    throw new HttpError(400, 'INVALID_TARGET', 'You cannot swipe on yourself');
  }
  await prisma.swipe.upsert({
    where: { fromUserId_toUserId: { fromUserId, toUserId } },
    update: { direction },
    create: { fromUserId, toUserId, direction },
  });

  if (direction === 'left') return { matched: false as const };

  const reciprocal = await prisma.swipe.findUnique({
    where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: fromUserId } },
  });
  if (!reciprocal || reciprocal.direction !== 'right') {
    return { matched: false as const };
  }

  const [userAId, userBId] = orderedPair(fromUserId, toUserId);
  const match = await prisma.match.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    update: {},
    create: { userAId, userBId },
  });
  const otherUser = await prisma.user.findUniqueOrThrow({ where: { id: toUserId } });
  return { matched: true as const, match: toMatchDto(match, fromUserId, otherUser), user: toPublicUser(otherUser) };
}
