import { DogWalkRequest, Dog, User } from '@prisma/client';
import { toPublicUser } from '../users/serialize';
import { toDogDto } from '../dogs/serialize';

/**
 * A "conversation" between one interested person and a shelter, about one specific dog — the requester's
 * thread shows the dog as who they're talking to ("on behalf of the dog"); the shelter's inbox shows both
 * the dog and the requester, since a shelter juggles many of these at once across many dogs.
 */
export function toDogRequestDto(
  request: DogWalkRequest,
  viewerId: string,
  dog: Dog,
  requester: User,
  shelter: User,
) {
  const viewerIsRequester = viewerId === request.requesterId;
  return {
    id: request.id,
    dogId: request.dogId,
    dog: toDogDto(dog),
    requesterId: request.requesterId,
    requester: toPublicUser(requester),
    shelterId: request.shelterId,
    shelter: toPublicUser(shelter),
    status: request.status as 'pending' | 'accepted' | 'declined',
    createdAt: request.createdAt.toISOString(),
    respondedAt: request.respondedAt?.toISOString(),
    lastMessage: request.lastMessage ?? '',
    lastMessageAt: request.lastMessageAt.toISOString(),
    unread: viewerIsRequester ? request.unreadForRequester : request.unreadForShelter,
  };
}
