import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';
import * as notificationsService from '../notifications/service';
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

export async function createEvent(organizerId: string, input: CreateEventInput) {
  const event = await prisma.event.create({
    data: {
      ...input,
      date: new Date(input.date),
      organizerId,
      participants: { create: { userId: organizerId } },
    },
    include: eventInclude,
  });
  return toEventDto(event, organizerId);
}

export async function joinEvent(eventId: string, userId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { participants: true } });
  if (!event) throw new HttpError(404, 'NOT_FOUND', 'Event not found');
  if (event.participants.some((p) => p.userId === userId)) return getEventById(eventId, userId);
  if (event.participants.length >= event.maxParticipants) {
    throw new HttpError(409, 'EVENT_FULL', 'This event is full');
  }
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
  return getEventById(eventId, userId);
}
