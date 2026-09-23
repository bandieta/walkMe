import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';
import { toPublicUser } from './serialize';
import { UpdateProfileInput } from './schema';

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'User not found');
  return toPublicUser(user);
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await prisma.user.update({ where: { id: userId }, data: input });
  return toPublicUser(user);
}
