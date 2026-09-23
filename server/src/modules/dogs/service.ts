import { prisma } from '../../lib/prisma';
import { toJsonArray } from '../../lib/json';
import { HttpError } from '../../middleware/errorHandler';
import { toDogDto } from './serialize';
import { CreateDogInput, UpdateDogInput } from './schema';

export async function getDogsByOwner(ownerId: string) {
  const dogs = await prisma.dog.findMany({ where: { ownerId }, orderBy: { createdAt: 'asc' } });
  return dogs.map(toDogDto);
}

export async function createDog(ownerId: string, input: CreateDogInput) {
  const dog = await prisma.dog.create({
    data: { ...input, personality: toJsonArray(input.personality), ownerId },
  });
  return toDogDto(dog);
}

async function assertOwnership(dogId: string, ownerId: string) {
  const dog = await prisma.dog.findUnique({ where: { id: dogId } });
  if (!dog) throw new HttpError(404, 'NOT_FOUND', 'Dog not found');
  if (dog.ownerId !== ownerId) throw new HttpError(403, 'FORBIDDEN', 'You do not own this dog');
  return dog;
}

export async function updateDog(dogId: string, ownerId: string, input: UpdateDogInput) {
  await assertOwnership(dogId, ownerId);
  const dog = await prisma.dog.update({
    where: { id: dogId },
    data: { ...input, personality: input.personality ? toJsonArray(input.personality) : undefined },
  });
  return toDogDto(dog);
}

export async function deleteDog(dogId: string, ownerId: string) {
  await assertOwnership(dogId, ownerId);
  await prisma.dog.delete({ where: { id: dogId } });
}
