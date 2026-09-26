import { Event, User, EventParticipant, EventDog, Dog } from '@prisma/client';
import { toPublicUser } from '../users/serialize';
import { toDogDto } from '../dogs/serialize';

type EventWithRelations = Event & {
  organizer: User;
  participants: EventParticipant[];
  dogs: (EventDog & { dog: Dog })[];
};

export function toEventDto(event: EventWithRelations, viewerId?: string) {
  // Grouped by participant: unlike Walk's one-dog-per-participant column, an event RSVP can name several dogs,
  // so this is an array per userId rather than a single DogDto.
  const participantDogs: Record<string, ReturnType<typeof toDogDto>[]> = {};
  for (const ed of event.dogs) {
    (participantDogs[ed.userId] ??= []).push(toDogDto(ed.dog));
  }
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
    myDogIds: viewerId ? (participantDogs[viewerId] ?? []).map((d) => d.id) : [],
    participantDogs,
    status: event.status,
    category: event.category,
    emoji: event.emoji ?? undefined,
    photoCaption: event.photoCaption ?? undefined,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

export const eventInclude = {
  organizer: true,
  participants: true,
  dogs: { include: { dog: true } },
} as const;
