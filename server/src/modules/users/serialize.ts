import { User } from '@prisma/client';

export function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email ?? undefined,
    displayName: user.displayName,
    photoUrl: user.photoUrl ?? undefined,
    bio: user.bio ?? undefined,
    age: user.age ?? undefined,
    location: user.location ?? undefined,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export type PublicUser = ReturnType<typeof toPublicUser>;
