import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';
import { toPublicUser } from '../users/serialize';
import { toDogDto } from '../dogs/serialize';
import { toMessageDto } from '../chat/serialize';
import * as notificationsService from '../notifications/service';
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

  const recipientId = otherUserId(match, senderId);
  await notificationsService.notify(recipientId, 'message', {
    name: message.sender.displayName,
    preview: content.length > 80 ? `${content.slice(0, 80)}…` : content,
  }, { tab: 'ChatTab', screen: 'DirectMessage', params: { matchId, userName: message.sender.displayName } });

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

/**
 * The Discover deck mixes two kinds of card: a person (with their own dogs, swiped on as a unit — the existing
 * behaviour) and a shelter's individual adoptable dog (its own card, "liked" on its own — see dogs/routes.ts's
 * POST /dogs/:id/like). A shelter dog's card carries `kind: 'shelterDog'` so the client knows to route a like
 * to the dog-request flow instead of the person-swipe flow.
 */
export async function getSwipeDeck(userId: string) {
  const [viewer, swiped, requested] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { lat: true, lng: true } }),
    prisma.swipe.findMany({ where: { fromUserId: userId }, select: { toUserId: true } }),
    prisma.dogWalkRequest.findMany({ where: { requesterId: userId }, select: { dogId: true } }),
  ]);
  const swipedIds = new Set(swiped.map((s) => s.toUserId));
  const requestedDogIds = new Set(requested.map((r) => r.dogId));

  const [personCandidates, shelterDogs] = await Promise.all([
    prisma.user.findMany({
      where: { id: { not: userId, notIn: [...swipedIds] }, provider: { not: 'filler' }, accountType: 'person' },
      include: { dogs: true },
      orderBy: { createdAt: 'asc' },
      take: 50,
    }),
    prisma.dog.findMany({
      // shelterId != userId also excludes personal dogs (shelterId is null there, and SQL NULL != x is never
      // true) and the viewer's own shelter's dogs in one filter, without a separate "not null" check.
      where: { shelterId: { not: userId }, id: { notIn: [...requestedDogIds] } },
      include: { shelter: true },
      orderBy: { createdAt: 'asc' },
      take: 30,
    }),
  ]);

  const distanceTo = (lat?: number | null, lng?: number | null) => {
    const hasGeo = viewer?.lat != null && viewer.lng != null && lat != null && lng != null;
    return hasGeo ? Math.round(haversineKm(viewer!.lat!, viewer!.lng!, lat!, lng!) * 10) / 10 : undefined;
  };

  const personCards = personCandidates.map((c) => ({
    kind: 'person' as const,
    ...toPublicUser(c),
    dogs: c.dogs.map(toDogDto),
    // Only present when both people have a home area; rounded to 0.1 km.
    ...(distanceTo(c.lat, c.lng) != null ? { distanceKm: distanceTo(c.lat, c.lng) } : {}),
  }));
  const shelterDogCards = shelterDogs
    .filter((d) => d.shelterId != null)
    .map((d) => ({
      kind: 'shelterDog' as const,
      id: d.id,
      dog: toDogDto(d),
      shelter: toPublicUser(d.shelter!),
      ...(distanceTo(d.shelter!.lat, d.shelter!.lng) != null ? { distanceKm: distanceTo(d.shelter!.lat, d.shelter!.lng) } : {}),
    }));

  return [...personCards, ...shelterDogCards];
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
  const [otherUser, fromUser] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: toUserId } }),
    prisma.user.findUniqueOrThrow({ where: { id: fromUserId } }),
  ]);
  await notificationsService.notify(fromUserId, 'match', { name: otherUser.displayName },
    { tab: 'ChatTab', screen: 'DirectMessage', params: { matchId: match.id, userName: otherUser.displayName } });
  await notificationsService.notify(toUserId, 'match', { name: fromUser.displayName },
    { tab: 'ChatTab', screen: 'DirectMessage', params: { matchId: match.id, userName: fromUser.displayName } });
  return { matched: true as const, match: toMatchDto(match, fromUserId, otherUser), user: toPublicUser(otherUser) };
}
