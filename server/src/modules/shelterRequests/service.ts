import { DogWalkRequest } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';
import { toMessageDto } from '../chat/serialize';
import { toDogDto } from '../dogs/serialize';
import * as notificationsService from '../notifications/service';
import { toDogRequestDto } from './serialize';

async function getRequestOrThrow(id: string) {
  const request = await prisma.dogWalkRequest.findUnique({ where: { id } });
  if (!request) throw new HttpError(404, 'NOT_FOUND', 'Request not found');
  return request;
}

function assertParticipant(request: { requesterId: string; shelterId: string }, viewerId: string) {
  if (request.requesterId !== viewerId && request.shelterId !== viewerId) {
    throw new HttpError(403, 'FORBIDDEN', 'You are not part of this conversation');
  }
}

async function withRelations(request: DogWalkRequest, viewerId: string) {
  const [dog, requester, shelter] = await Promise.all([
    prisma.dog.findUniqueOrThrow({ where: { id: request.dogId } }),
    prisma.user.findUniqueOrThrow({ where: { id: request.requesterId } }),
    prisma.user.findUniqueOrThrow({ where: { id: request.shelterId } }),
  ]);
  return toDogRequestDto(request, viewerId, dog, requester, shelter);
}

/**
 * "Liking" a shelter dog in Discover: creates the request that lets the shelter see there's interest and, once
 * they accept, opens a conversation scoped to this one dog. Re-liking a dog you'd been declined for re-opens it
 * as pending — everything else (already pending or already accepted) is a no-op, so this call is always safe
 * to repeat.
 */
export async function likeDog(requesterId: string, dogId: string) {
  const dog = await prisma.dog.findUnique({ where: { id: dogId } });
  if (!dog) throw new HttpError(404, 'NOT_FOUND', 'Dog not found');
  if (!dog.shelterId) throw new HttpError(400, 'NOT_A_SHELTER_DOG', 'This dog is not listed by a shelter');
  if (dog.shelterId === requesterId) throw new HttpError(400, 'INVALID_TARGET', 'You cannot request your own dog');

  const existing = await prisma.dogWalkRequest.findUnique({
    where: { dogId_requesterId: { dogId, requesterId } },
  });
  const request = existing
    ? existing.status === 'declined'
      ? await prisma.dogWalkRequest.update({
          where: { id: existing.id },
          data: { status: 'pending', respondedAt: null },
        })
      : existing
    : await prisma.dogWalkRequest.create({
        data: { dogId, requesterId, shelterId: dog.shelterId },
      });

  const requester = await prisma.user.findUniqueOrThrow({ where: { id: requesterId } });
  await notificationsService.notify(
    dog.shelterId,
    'shelter_request',
    { name: requester.displayName, dogName: dog.name },
    { tab: 'ChatTab', screen: 'ChatList' },
  );

  return withRelations(request, requesterId);
}

/** A person's sent requests, or a shelter's inbox across all its dogs — whichever this user is. */
export async function listForUser(userId: string) {
  const viewer = await prisma.user.findUnique({ where: { id: userId } });
  if (!viewer) throw new HttpError(404, 'NOT_FOUND', 'User not found');
  const isShelter = viewer.accountType === 'shelter';
  const requests = await prisma.dogWalkRequest.findMany({
    where: isShelter ? { shelterId: userId } : { requesterId: userId },
    orderBy: { lastMessageAt: 'desc' },
  });
  if (!requests.length) return [];
  const dogIds = [...new Set(requests.map((r) => r.dogId))];
  const otherIds = [...new Set(requests.map((r) => (isShelter ? r.requesterId : r.shelterId)))];
  const [dogs, others] = await Promise.all([
    prisma.dog.findMany({ where: { id: { in: dogIds } } }),
    prisma.user.findMany({ where: { id: { in: otherIds } } }),
  ]);
  const dogById = new Map(dogs.map((d) => [d.id, d]));
  const userById = new Map(others.map((u) => [u.id, u]));
  return requests.map((r) => {
    const dog = dogById.get(r.dogId)!;
    const requester = isShelter ? userById.get(r.requesterId)! : viewer;
    const shelter = isShelter ? viewer : userById.get(r.shelterId)!;
    return toDogRequestDto(r, userId, dog, requester, shelter);
  });
}

async function assertIsShelterOnRequest(id: string, shelterId: string) {
  const request = await getRequestOrThrow(id);
  if (request.shelterId !== shelterId) throw new HttpError(403, 'FORBIDDEN', 'Only the shelter can respond to this request');
  return request;
}

export async function acceptRequest(id: string, shelterId: string) {
  const before = await assertIsShelterOnRequest(id, shelterId);
  const request = await prisma.dogWalkRequest.update({ where: { id }, data: { status: 'accepted', respondedAt: new Date() } });
  const [shelter, dog] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: shelterId } }),
    prisma.dog.findUniqueOrThrow({ where: { id: before.dogId } }),
  ]);
  await notificationsService.notify(
    before.requesterId,
    'shelter_accepted',
    { shelterName: shelter.displayName, dogName: dog.name },
    { tab: 'ChatTab', screen: 'DogRequestChat', params: { requestId: id } },
  );
  return withRelations(request, shelterId);
}

export async function declineRequest(id: string, shelterId: string) {
  const before = await assertIsShelterOnRequest(id, shelterId);
  const request = await prisma.dogWalkRequest.update({ where: { id }, data: { status: 'declined', respondedAt: new Date() } });
  const [shelter, dog] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: shelterId } }),
    prisma.dog.findUniqueOrThrow({ where: { id: before.dogId } }),
  ]);
  await notificationsService.notify(
    before.requesterId,
    'shelter_declined',
    { shelterName: shelter.displayName, dogName: dog.name },
    { tab: 'ChatTab', screen: 'ChatList' },
  );
  return withRelations(request, shelterId);
}

export async function getMessages(id: string, viewerId: string) {
  const request = await getRequestOrThrow(id);
  assertParticipant(request, viewerId);
  const messages = await prisma.message.findMany({ where: { roomId: id }, orderBy: { createdAt: 'asc' }, include: { sender: true } });
  return messages.map(toMessageDto);
}

export async function sendMessage(id: string, senderId: string, content: string) {
  const request = await getRequestOrThrow(id);
  assertParticipant(request, senderId);
  if (request.status !== 'accepted') {
    throw new HttpError(400, 'NOT_ACCEPTED', 'The shelter needs to accept this request before you can message each other');
  }

  const message = await prisma.message.create({ data: { roomId: id, senderId, content, type: 'text' }, include: { sender: true } });

  const senderIsRequester = request.requesterId === senderId;
  await prisma.dogWalkRequest.update({
    where: { id },
    data: {
      lastMessage: content,
      lastMessageAt: new Date(),
      ...(senderIsRequester ? { unreadForShelter: { increment: 1 } } : { unreadForRequester: { increment: 1 } }),
    },
  });

  const recipientId = senderIsRequester ? request.shelterId : request.requesterId;
  await notificationsService.notify(
    recipientId,
    'message',
    { name: message.sender.displayName, preview: content.length > 80 ? `${content.slice(0, 80)}…` : content },
    { tab: 'ChatTab', screen: 'DogRequestChat', params: { requestId: id } },
  );

  return toMessageDto(message);
}

export async function markRead(id: string, viewerId: string) {
  const request = await getRequestOrThrow(id);
  assertParticipant(request, viewerId);
  const viewerIsRequester = request.requesterId === viewerId;
  await prisma.dogWalkRequest.update({
    where: { id },
    data: viewerIsRequester ? { unreadForRequester: 0 } : { unreadForShelter: 0 },
  });
}

/** Own dogs plus any shelter dog this person has been approved to walk — CreateWalkScreen's "bring a dog" picker. */
export async function getWalkableDogs(userId: string) {
  const [ownDogs, accepted] = await Promise.all([
    prisma.dog.findMany({ where: { ownerId: userId }, orderBy: { createdAt: 'asc' } }),
    prisma.dogWalkRequest.findMany({ where: { requesterId: userId, status: 'accepted' }, include: { dog: true }, orderBy: { respondedAt: 'asc' } }),
  ]);
  return {
    ownDogs: ownDogs.map(toDogDto),
    shelterDogs: accepted.map((r) => toDogDto(r.dog)),
  };
}
