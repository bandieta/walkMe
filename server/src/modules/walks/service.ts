import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';
import * as notificationsService from '../notifications/service';
import { toWalkDto, walkInclude } from './serialize';
import { CreateWalkInput } from './schema';

/** A dog is walkable by this user if they own it, or a shelter has accepted their request to walk it. */
async function assertCanWalkDog(userId: string, dogId: string) {
  const dog = await prisma.dog.findUnique({ where: { id: dogId } });
  if (!dog) throw new HttpError(404, 'NOT_FOUND', 'Dog not found');
  if (dog.ownerId === userId) return;
  const approved = await prisma.dogWalkRequest.findUnique({
    where: { dogId_requesterId: { dogId, requesterId: userId } },
  });
  if (approved?.status === 'accepted') return;
  throw new HttpError(403, 'FORBIDDEN', 'You are not approved to walk this dog');
}

// Simple haversine distance in km — good enough for a first version;
// swap for a DB-native geo query when scaling up.
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function listWalks(near?: { lat: number; lng: number; radiusKm: number }) {
  const walks = await prisma.walk.findMany({
    include: walkInclude,
    orderBy: { scheduledAt: 'asc' },
  });
  const filtered = near
    ? walks.filter((w) => distanceKm(near.lat, near.lng, w.meetingLat, w.meetingLng) <= near.radiusKm)
    : walks;
  return filtered.map(toWalkDto);
}

export async function getWalkById(id: string) {
  const walk = await prisma.walk.findUnique({ where: { id }, include: walkInclude });
  if (!walk) throw new HttpError(404, 'NOT_FOUND', 'Walk not found');
  return toWalkDto(walk);
}

/** Nearby, opted-in users get a heads-up about a brand new walk — each against their own saved radius. */
async function notifyNearbyUsers(walk: { id: string; title: string; meetingPoint: string; meetingLat: number; meetingLng: number; hostId: string }) {
  const candidates = await prisma.user.findMany({
    where: { id: { not: walk.hostId }, lat: { not: null }, lng: { not: null }, radiusKm: { not: null } },
    select: { id: true, lat: true, lng: true, radiusKm: true },
  });
  await Promise.all(
    candidates
      .filter((u) => distanceKm(u.lat!, u.lng!, walk.meetingLat, walk.meetingLng) <= u.radiusKm!)
      .map((u) =>
        notificationsService.notify(
          u.id,
          'walk_nearby',
          { walkTitle: walk.title, meetingPoint: walk.meetingPoint },
          { tab: 'MapTab', screen: 'WalkDetail', params: { walkId: walk.id } },
        ),
      ),
  );
}

export async function createWalk(hostId: string, input: CreateWalkInput) {
  const { dogId, ...rest } = input;
  if (dogId) await assertCanWalkDog(hostId, dogId);
  const walk = await prisma.walk.create({
    data: {
      ...rest,
      scheduledAt: new Date(input.scheduledAt),
      hostId,
      participants: { create: { userId: hostId, dogId } },
    },
    include: walkInclude,
  });
  await notifyNearbyUsers(walk);
  return toWalkDto(walk);
}

export async function joinWalk(walkId: string, userId: string, dogId?: string) {
  const walk = await prisma.walk.findUnique({ where: { id: walkId }, include: { participants: true } });
  if (!walk) throw new HttpError(404, 'NOT_FOUND', 'Walk not found');
  if (walk.participants.length >= walk.maxParticipants) {
    throw new HttpError(409, 'WALK_FULL', 'This walk is full');
  }
  if (dogId) await assertCanWalkDog(userId, dogId);
  await prisma.walkParticipant.upsert({
    where: { walkId_userId: { walkId, userId } },
    update: { dogId },
    create: { walkId, userId, dogId },
  });
  if (userId !== walk.hostId) {
    const joiner = await prisma.user.findUnique({ where: { id: userId } });
    if (joiner) {
      await notificationsService.notify(
        walk.hostId,
        'walk_joined',
        { name: joiner.displayName, walkTitle: walk.title },
        { tab: 'MapTab', screen: 'WalkDetail', params: { walkId } },
      );
    }
  }
  return getWalkById(walkId);
}

export async function leaveWalk(walkId: string, userId: string) {
  const walk = await prisma.walk.findUnique({ where: { id: walkId } });
  const leaver = walk && userId !== walk.hostId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  await prisma.walkParticipant.deleteMany({ where: { walkId, userId } });
  if (walk && leaver) {
    await notificationsService.notify(
      walk.hostId,
      'walk_left',
      { name: leaver.displayName, walkTitle: walk.title },
      { tab: 'MapTab', screen: 'WalkDetail', params: { walkId } },
    );
  }
  return getWalkById(walkId);
}

export async function updateWalkStatus(walkId: string, hostId: string, status: string) {
  const walk = await prisma.walk.findUnique({ where: { id: walkId } });
  if (!walk) throw new HttpError(404, 'NOT_FOUND', 'Walk not found');
  if (walk.hostId !== hostId) throw new HttpError(403, 'FORBIDDEN', 'Only the host can change walk status');
  await prisma.walk.update({ where: { id: walkId }, data: { status } });
  return getWalkById(walkId);
}
