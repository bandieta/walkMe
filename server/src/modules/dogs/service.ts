import { prisma } from '../../lib/prisma';
import { toJsonArray } from '../../lib/json';
import { HttpError } from '../../middleware/errorHandler';
import { toDogDto } from './serialize';
import { CreateDogInput, UpdateDogInput } from './schema';

export async function getDogsByOwner(ownerId: string) {
  const dogs = await prisma.dog.findMany({ where: { ownerId }, orderBy: { createdAt: 'asc' } });
  return dogs.map(toDogDto);
}

export async function getDogsByShelter(shelterId: string) {
  const dogs = await prisma.dog.findMany({ where: { shelterId }, orderBy: { createdAt: 'asc' } });
  return dogs.map(toDogDto);
}

/** A profile's "dogs" section: a person's own dogs, or a shelter's adoptable roster — whichever this user is. */
export async function getDogsForUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { accountType: true } });
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'User not found');
  return user.accountType === 'shelter' ? getDogsByShelter(userId) : getDogsByOwner(userId);
}

/**
 * Creates a dog under whichever caller is adding it: a shelter account's dogs have no personal owner
 * (shelterId instead — see Dog.shelterId), a person's dog is owned the usual way.
 */
export async function createDog(callerId: string, input: CreateDogInput) {
  const caller = await prisma.user.findUnique({ where: { id: callerId }, select: { accountType: true } });
  if (!caller) throw new HttpError(404, 'NOT_FOUND', 'User not found');
  const isShelter = caller.accountType === 'shelter';
  const dog = await prisma.dog.create({
    data: {
      ...input,
      personality: toJsonArray(input.personality),
      ...(isShelter ? { shelterId: callerId } : { ownerId: callerId }),
    },
  });
  return toDogDto(dog);
}

async function assertCanManage(dogId: string, callerId: string) {
  const dog = await prisma.dog.findUnique({ where: { id: dogId } });
  if (!dog) throw new HttpError(404, 'NOT_FOUND', 'Dog not found');
  if (dog.ownerId !== callerId && dog.shelterId !== callerId) {
    throw new HttpError(403, 'FORBIDDEN', 'You do not manage this dog');
  }
  return dog;
}

export async function updateDog(dogId: string, callerId: string, input: UpdateDogInput) {
  await assertCanManage(dogId, callerId);
  const dog = await prisma.dog.update({
    where: { id: dogId },
    data: { ...input, personality: input.personality ? toJsonArray(input.personality) : undefined },
  });
  return toDogDto(dog);
}

export async function deleteDog(dogId: string, callerId: string) {
  await assertCanManage(dogId, callerId);
  await prisma.dog.delete({ where: { id: dogId } });
}
