import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';
import { toWalkDto, walkInclude } from './serialize';
import { CreateWalkInput } from './schema';

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

export async function createWalk(hostId: string, input: CreateWalkInput) {
  const walk = await prisma.walk.create({
    data: {
      ...input,
      scheduledAt: new Date(input.scheduledAt),
      hostId,
      participants: { create: { userId: hostId } },
    },
    include: walkInclude,
  });
  return toWalkDto(walk);
}

export async function joinWalk(walkId: string, userId: string) {
  const walk = await prisma.walk.findUnique({ where: { id: walkId }, include: { participants: true } });
  if (!walk) throw new HttpError(404, 'NOT_FOUND', 'Walk not found');
  if (walk.participants.length >= walk.maxParticipants) {
    throw new HttpError(409, 'WALK_FULL', 'This walk is full');
  }
  await prisma.walkParticipant.upsert({
    where: { walkId_userId: { walkId, userId } },
    update: {},
    create: { walkId, userId },
  });
  return getWalkById(walkId);
}

export async function leaveWalk(walkId: string, userId: string) {
  await prisma.walkParticipant.deleteMany({ where: { walkId, userId } });
  return getWalkById(walkId);
}

export async function updateWalkStatus(walkId: string, hostId: string, status: string) {
  const walk = await prisma.walk.findUnique({ where: { id: walkId } });
  if (!walk) throw new HttpError(404, 'NOT_FOUND', 'Walk not found');
  if (walk.hostId !== hostId) throw new HttpError(403, 'FORBIDDEN', 'Only the host can change walk status');
  await prisma.walk.update({ where: { id: walkId }, data: { status } });
  return getWalkById(walkId);
}
