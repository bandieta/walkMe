import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';
import { toPublicUser, toSelfUser } from './serialize';
import { UpdateProfileInput } from './schema';

// A shared placeholder every deleted account's messages get reassigned to before the row itself is removed,
// so a group walk chat or a DM thread keeps reading sensibly ("Deleted user: ...") instead of the message
// vanishing along with its author. One row, created lazily, reused by every deletion. providerId is a fixed
// sentinel value rather than something derived from the deleted account, so re-running this never creates a
// second one.
const DELETED_USER_PROVIDER_ID = 'deleted-user-sentinel';

async function getOrCreateDeletedUserSentinel() {
  const existing = await prisma.user.findFirst({ where: { provider: 'system', providerId: DELETED_USER_PROVIDER_ID } });
  if (existing) return existing;
  return prisma.user.create({
    data: { provider: 'system', providerId: DELETED_USER_PROVIDER_ID, displayName: 'Deleted user' },
  });
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'User not found');
  return toPublicUser(user);
}

export async function getMe(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'User not found');
  return toSelfUser(user);
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
  return toSelfUser(user);
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

/**
 * The shared delete path for both self-service ("delete my account", App Store / Play Store require this to
 * exist in-app) and the admin panel's own user deletion, which used to just call `prisma.user.delete` directly
 * with none of the cleanup below.
 *
 * Most of a user's data cascades automatically via `onDelete: Cascade` in the schema (dogs, walk/event
 * participation, refresh tokens, dog-walk requests, notifications and preferences) — but three things need
 * doing by hand first:
 *
 * 1. Messages: the schema cascades a deleted sender's messages away entirely, which would leave holes in a
 *    walk's group chat or a shelter thread the other side is still reading. Reassigning them to a shared
 *    "Deleted user" sentinel first keeps the conversation readable instead.
 * 2. Hosted walks / organized events: cascading the *host* also cascades the whole Walk/Event row (and with it
 *    every other participant's membership and every message in it) — fine if no one else had joined, needless
 *    collateral damage if they had. Handing the walk to another participant first lets it survive.
 * 3. Match, Swipe, Block: none of these have a Prisma-level relation to User (plain string id columns, so
 *    Discover's "who have I already swiped on" query isn't forced through a join) — the cascade never touches
 *    them, so they must be cleaned up explicitly or they'd sit forever as orphaned rows pointing at a deleted
 *    id. (This was already true of the admin panel's hard delete before this function existed.)
 */
export async function deleteAccount(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'User not found');

  const sentinel = await getOrCreateDeletedUserSentinel();
  if (userId !== sentinel.id) {
    await prisma.message.updateMany({ where: { senderId: userId }, data: { senderId: sentinel.id } });
  }

  const hostedWalks = await prisma.walk.findMany({ where: { hostId: userId }, include: { participants: true } });
  for (const walk of hostedWalks) {
    const successor = walk.participants.find((p) => p.userId !== userId);
    if (successor) await prisma.walk.update({ where: { id: walk.id }, data: { hostId: successor.userId } });
  }
  const organizedEvents = await prisma.event.findMany({ where: { organizerId: userId }, include: { participants: true } });
  for (const event of organizedEvents) {
    const successor = event.participants.find((p) => p.userId !== userId);
    if (successor) await prisma.event.update({ where: { id: event.id }, data: { organizerId: successor.userId } });
  }

  const matches = await prisma.match.findMany({ where: { OR: [{ userAId: userId }, { userBId: userId }] }, select: { id: true } });
  if (matches.length) {
    await prisma.message.deleteMany({ where: { roomId: { in: matches.map((m) => m.id) } } });
    await prisma.match.deleteMany({ where: { OR: [{ userAId: userId }, { userBId: userId }] } });
  }
  // Same orphaned-room concern as Match, for the other kind of room key Message.roomId can hold.
  const dogRequests = await prisma.dogWalkRequest.findMany({
    where: { OR: [{ requesterId: userId }, { shelterId: userId }] },
    select: { id: true },
  });
  if (dogRequests.length) {
    await prisma.message.deleteMany({ where: { roomId: { in: dogRequests.map((r) => r.id) } } });
  }
  await prisma.swipe.deleteMany({ where: { OR: [{ fromUserId: userId }, { toUserId: userId }] } });

  await prisma.user.delete({ where: { id: userId } });
}
