import { Dog } from '@prisma/client';
import { fromJsonArray } from '../../lib/json';

export function toDogDto(dog: Dog) {
  return {
    id: dog.id,
    ownerId: dog.ownerId,
    name: dog.name,
    breed: dog.breed,
    age: dog.age,
    weight: dog.weight ?? undefined,
    bio: dog.bio ?? undefined,
    emoji: dog.emoji ?? undefined,
    personality: fromJsonArray(dog.personality),
    createdAt: dog.createdAt.toISOString(),
    updatedAt: dog.updatedAt.toISOString(),
  };
}
