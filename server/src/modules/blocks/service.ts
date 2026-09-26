import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';
import { toPublicUser } from '../users/serialize';

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) throw new HttpError(400, 'INVALID_TARGET', 'You cannot block yourself');
  const target = await prisma.user.findUnique({ where: { id: blockedId } });
  if (!target) throw new HttpError(404, 'NOT_FOUND', 'User not found');
  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    update: {},
    create: { blockerId, blockedId },
  });
  return { success: true };
}

export async function unblockUser(blockerId: string, blockedId: string) {
  await prisma.block.deleteMany({ where: { blockerId, blockedId } });
  return { success: true };
}

export async function listBlocked(blockerId: string) {
  const blocks = await prisma.block.findMany({
    where: { blockerId },
    orderBy: { createdAt: 'desc' },
    include: { blocked: true },
  });
  return blocks.map((b) => ({ ...toPublicUser(b.blocked), blockedAt: b.createdAt.toISOString() }));
}

/** True if either person has blocked the other — the direction never matters to how the app behaves. */
export async function isBlockedPair(a: string, b: string) {
  const row = await prisma.block.findFirst({
    where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] },
    select: { id: true },
  });
  return !!row;
}

/**
 * Every user id blocked-with `userId` in either direction, for excluding them from a list query in one query
 * instead of an isBlockedPair check per row — Discover, walk listings and dog-request/match threads all use
 * this rather than filtering after the fact.
 */
export async function blockedUserIds(userId: string): Promise<string[]> {
  const rows = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  const ids = new Set<string>();
  for (const r of rows) ids.add(r.blockerId === userId ? r.blockedId : r.blockerId);
  return [...ids];
}
