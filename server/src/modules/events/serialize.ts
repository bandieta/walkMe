import { Event, User, EventParticipant } from '@prisma/client';
import { toPublicUser } from '../users/serialize';

type EventWithRelations = Event & {
  organizer: User;
  participants: EventParticipant[];
};

export function toEventDto(event: EventWithRelations, viewerId?: string) {
  return {
    id: event.id,
    title: event.title,
    description: event.description ?? undefined,
    date: event.date.toISOString(),
    location: event.location,
    lat: event.lat,
    lng: event.lng,
    organizerId: event.organizerId,
    organizer: toPublicUser(event.organizer),
    participantCount: event.participants.length,
    maxParticipants: event.maxParticipants,
    isJoined: viewerId ? event.participants.some((p) => p.userId === viewerId) : false,
    status: event.status,
    category: event.category,
    emoji: event.emoji ?? undefined,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

export const eventInclude = {
  organizer: true,
  participants: true,
} as const;
