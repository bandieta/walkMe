import { Match, User } from '@prisma/client';
import { toPublicUser } from '../users/serialize';

export function toMatchDto(match: Match, viewerId: string, otherUser: User) {
  const viewerIsA = match.userAId === viewerId;
  return {
    id: match.id,
    userId: otherUser.id,
    user: toPublicUser(otherUser),
    matchedAt: match.matchedAt.toISOString(),
    lastMessage: match.lastMessage ?? '',
    lastMessageAt: match.lastMessageAt.toISOString(),
    unread: viewerIsA ? match.unreadForA : match.unreadForB,
  };
}

export function otherUserId(match: Match, viewerId: string) {
  return match.userAId === viewerId ? match.userBId : match.userAId;
}

/** Deterministic ordering so (A,B) and (B,A) always map to the same unique pair. */
export function orderedPair(userId1: string, userId2: string): [string, string] {
  return userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
}
