import { Dog } from '@prisma/client';
import { fromJsonArray } from '../../lib/json';

export function toDogDto(dog: Dog) {
  return {
    id: dog.id,
    ownerId: dog.ownerId ?? undefined,
    shelterId: dog.shelterId ?? undefined,
    name: dog.name,
    breed: dog.breed,
    age: dog.age,
    weight: dog.weight ?? undefined,
    bio: dog.bio ?? undefined,
    emoji: dog.emoji ?? undefined,
    energy: dog.energy ?? undefined,
    ageGroup: dog.ageGroup ?? undefined,
    photoUrl: dog.photoUrl ?? undefined,
    personality: fromJsonArray(dog.personality),
    createdAt: dog.createdAt.toISOString(),
    updatedAt: dog.updatedAt.toISOString(),
  };
}
