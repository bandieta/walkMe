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
  const [viewer, otherUsers] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { lat: true, lng: true } }),
    prisma.user.findMany({ where: { id: { in: otherIds } }, include: { dogs: true } }),
  ]);
  const byId = new Map(otherUsers.map((u) => [u.id, u]));
  // Additive: who wrote each thread's last message, so the chat list can prefix "You: ".
  const lastSenders = matches.length
    ? await prisma.message.findMany({
        where: { roomId: { in: matches.map((m) => m.id) } },
        orderBy: { createdAt: 'desc' },
        distinct: ['roomId'],
        select: { roomId: true, senderId: true },
      })
    : [];
  const lastSenderOf = new Map(lastSenders.map((s) => [s.roomId, s.senderId]));
  return matches.map((m) => {
    const other = byId.get(otherUserId(m, userId))!;
    const hasGeo = viewer?.lat != null && viewer.lng != null && other.lat != null && other.lng != null;
    const dto = toMatchDto(m, userId, other);
    // Additive: the thread header / chat list show the other person's dog and how far away they live.
    return {
      ...dto,
      ...(lastSenderOf.has(m.id) ? { lastMessageSenderId: lastSenderOf.get(m.id) } : {}),
      user: {
        ...dto.user,
        dogs: other.dogs.map(toDogDto),
        ...(hasGeo ? { distanceKm: Math.round(haversineKm(viewer!.lat!, viewer!.lng!, other.lat!, other.lng!) * 10) / 10 } : {}),
      },
    };
  });
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

/** Great-circle distance in km. */
function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(rad(bLat - aLat) / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(rad(bLng - aLng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export async function getSwipeDeck(userId: string) {
  const [viewer, swiped] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { lat: true, lng: true } }),
    prisma.swipe.findMany({ where: { fromUserId: userId }, select: { toUserId: true } }),
  ]);
  const swipedIds = new Set(swiped.map((s) => s.toUserId));
  const candidates = await prisma.user.findMany({
    where: { id: { not: userId, notIn: [...swipedIds] }, provider: { not: 'filler' } },
    include: { dogs: true },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });
  return candidates.map((c) => {
    const hasGeo = viewer?.lat != null && viewer.lng != null && c.lat != null && c.lng != null;
    return {
      ...toPublicUser(c),
      dogs: c.dogs.map(toDogDto),
      // Only present when both people have a home area; rounded to 0.1 km.
      ...(hasGeo ? { distanceKm: Math.round(haversineKm(viewer!.lat!, viewer!.lng!, c.lat!, c.lng!) * 10) / 10 } : {}),
    };
  });
}

/** Forget every swipe the viewer made, so the whole deck comes back ("Start over"). Existing matches are kept. */
export async function resetSwipes(userId: string) {
  const { count } = await prisma.swipe.deleteMany({ where: { fromUserId: userId } });
  return { success: true, reset: count };
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
