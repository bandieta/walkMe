import { Walk, User, WalkParticipant } from '@prisma/client';
import { toPublicUser } from '../users/serialize';

type WalkWithRelations = Walk & {
  host: User;
  participants: (WalkParticipant & { user: User })[];
};

export function toWalkDto(walk: WalkWithRelations) {
  return {
    id: walk.id,
    title: walk.title,
    description: walk.description ?? undefined,
    category: walk.category,
    hostId: walk.hostId,
    host: toPublicUser(walk.host),
    meetingLat: walk.meetingLat,
    meetingLng: walk.meetingLng,
    meetingPoint: walk.meetingPoint,
    scheduledAt: walk.scheduledAt.toISOString(),
    maxParticipants: walk.maxParticipants,
    participantIds: walk.participants.map((p) => p.userId),
    participants: walk.participants.map((p) => toPublicUser(p.user)),
    status: walk.status,
    duration: walk.duration,
    createdAt: walk.createdAt.toISOString(),
    updatedAt: walk.updatedAt.toISOString(),
  };
}

export const walkInclude = {
  host: true,
  participants: { include: { user: true } },
} as const;
