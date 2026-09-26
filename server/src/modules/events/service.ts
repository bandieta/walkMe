import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';
import * as notificationsService from '../notifications/service';
import { assertCanBringDog } from '../dogs/service';
import { eventInclude, toEventDto } from './serialize';
import { CreateEventInput } from './schema';

export async function listEvents(viewerId?: string) {
  const events = await prisma.event.findMany({ include: eventInclude, orderBy: { date: 'asc' } });
  return events.map((e) => toEventDto(e, viewerId));
}

export async function getEventById(id: string, viewerId?: string) {
  const event = await prisma.event.findUnique({ where: { id }, include: eventInclude });
  if (!event) throw new HttpError(404, 'NOT_FOUND', 'Event not found');
  return toEventDto(event, viewerId);
}

/** Replaces which dogs this participant is bringing — used on every join call (including a repeat one, which
 * is how "edit my dogs" works) and on event creation for the organizer. Each dog is checked the same way a
 * walk checks one: owned by this user, or a shelter-approved dog. */
async function setEventDogs(eventId: string, userId: string, dogIds: string[] | undefined) {
  const ids = [...new Set(dogIds ?? [])];
  for (const dogId of ids) await assertCanBringDog(userId, dogId);
  await prisma.eventDog.deleteMany({ where: { eventId, userId } });
  if (ids.length) {
    await prisma.eventDog.createMany({ data: ids.map((dogId) => ({ eventId, userId, dogId })) });
  }
}

export async function createEvent(organizerId: string, input: CreateEventInput) {
  const { dogIds, ...rest } = input;
  for (const dogId of dogIds ?? []) await assertCanBringDog(organizerId, dogId);
  const event = await prisma.event.create({
    data: {
      ...rest,
      date: new Date(input.date),
      organizerId,
      participants: { create: { userId: organizerId } },
      ...(dogIds?.length ? { dogs: { create: dogIds.map((dogId) => ({ userId: organizerId, dogId })) } } : {}),
    },
    include: eventInclude,
  });
  return toEventDto(event, organizerId);
}

export async function joinEvent(eventId: string, userId: string, dogIds?: string[]) {
  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { participants: true } });
  if (!event) throw new HttpError(404, 'NOT_FOUND', 'Event not found');
  const alreadyJoined = event.participants.some((p) => p.userId === userId);
  if (!alreadyJoined && event.participants.length >= event.maxParticipants) {
    throw new HttpError(409, 'EVENT_FULL', 'This event is full');
  }
  // Omitting dogIds entirely leaves an existing selection alone (e.g. a plain re-join call); passing an
  // explicit array — including [] — replaces it, which is how the mobile "edit my dogs" flow works.
  if (dogIds !== undefined) await setEventDogs(eventId, userId, dogIds);
  if (alreadyJoined) return getEventById(eventId, userId);

  await prisma.eventParticipant.create({ data: { eventId, userId } });
  if (userId !== event.organizerId) {
    const joiner = await prisma.user.findUnique({ where: { id: userId } });
    if (joiner) {
      await notificationsService.notify(
        event.organizerId,
        'event_joined',
        { name: joiner.displayName, eventTitle: event.title },
        { tab: 'MapTab', screen: 'EventDetail', params: { eventId } },
      );
    }
  }
  return getEventById(eventId, userId);
}

export async function leaveEvent(eventId: string, userId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new HttpError(404, 'NOT_FOUND', 'Event not found');
  if (event.organizerId === userId) {
    throw new HttpError(400, 'ORGANIZER_CANNOT_LEAVE', 'The organizer cannot leave their own event');
  }
  await prisma.eventParticipant.deleteMany({ where: { eventId, userId } });
  await prisma.eventDog.deleteMany({ where: { eventId, userId } });
  return getEventById(eventId, userId);
}
