import { User } from '@prisma/client';
import { fromJsonArray } from '../../lib/json';

export function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email ?? undefined,
    // Not sensitive on its own (just "how did they sign in" — google/facebook/apple/email/dev), and it's the
    // one signal a person's public profile can show that they didn't type in themselves: PersonProfileScreen
    // reads it as "identity confirmed with {provider}" when a shelter is deciding whether to trust a walker.
    provider: user.provider as 'google' | 'facebook' | 'apple' | 'email' | 'dev',
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
    accountType: user.accountType as 'person' | 'shelter',
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export type PublicUser = ReturnType<typeof toPublicUser>;
