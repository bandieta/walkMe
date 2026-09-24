import { User } from '@prisma/client';
import { fromJsonArray } from '../../lib/json';

export function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email ?? undefined,
    displayName: user.displayName,
    photoUrl: user.photoUrl ?? undefined,
    bio: user.bio ?? undefined,
    age: user.age ?? undefined,
    location: user.location ?? undefined,
    lat: user.lat ?? undefined,
    lng: user.lng ?? undefined,
    walkTimes: user.walkTimes ? fromJsonArray(user.walkTimes) : undefined,
    radiusKm: user.radiusKm ?? undefined,
    onboarded: user.onboardedAt != null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export type PublicUser = ReturnType<typeof toPublicUser>;
