import { Walk, User, Dog, WalkParticipant } from '@prisma/client';
import { toPublicUser } from '../users/serialize';
import { toDogDto } from '../dogs/serialize';

type UserWithDogs = User & { dogs?: Dog[] };
type WalkWithRelations = Walk & {
  host: UserWithDogs;
  participants: (WalkParticipant & { user: UserWithDogs })[];
};

// A walk's people carry their dogs so clients can show "Mochi · Golden Retriever" without an extra request per person.
const withDogs = (user: UserWithDogs) => ({ ...toPublicUser(user), dogs: (user.dogs ?? []).map(toDogDto) });

export function toWalkDto(walk: WalkWithRelations) {
  return {
    id: walk.id,
    title: walk.title,
    description: walk.description ?? undefined,
    category: walk.category,
    hostId: walk.hostId,
    host: withDogs(walk.host),
    meetingLat: walk.meetingLat,
    meetingLng: walk.meetingLng,
    meetingPoint: walk.meetingPoint,
    scheduledAt: walk.scheduledAt.toISOString(),
    maxParticipants: walk.maxParticipants,
    participantIds: walk.participants.map((p) => p.userId),
    participants: walk.participants.map((p) => withDogs(p.user)),
    status: walk.status,
    duration: walk.duration,
    createdAt: walk.createdAt.toISOString(),
    updatedAt: walk.updatedAt.toISOString(),
  };
}

export const walkInclude = {
  host: { include: { dogs: true } },
  participants: { include: { user: { include: { dogs: true } } } },
} as const;
