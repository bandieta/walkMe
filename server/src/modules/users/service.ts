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
  const { walkTimes, onboarded, ...rest } = input;
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...rest,
      ...(walkTimes ? { walkTimes: JSON.stringify(walkTimes) } : {}),
      ...(onboarded ? { onboardedAt: new Date() } : {}),
    },
  });
  return toPublicUser(user);
}

/** Profile numbers: walks finished, walk friends (matches) and an estimate of km walked together (4 km per walk-hour). */
export async function getStats(userId: string) {
  const [entries, friends] = await Promise.all([
    prisma.walkParticipant.findMany({ where: { userId, walk: { status: 'ended' } }, include: { walk: true } }),
    prisma.match.count({ where: { OR: [{ userAId: userId }, { userBId: userId }] } }),
  ]);
  const hours = entries.reduce((sum, e) => {
    const m = /([\d.]+)\s*(min|h)/i.exec(e.walk.duration);
    if (!m) return sum + 1;
    return sum + (m[2].toLowerCase() === 'min' ? Number(m[1]) / 60 : Number(m[1]));
  }, 0);
  return { walks: entries.length, friends, km: Math.round(hours * 4) };
}
