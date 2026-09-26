import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { HttpError } from '../../middleware/errorHandler';
import { signAdminToken } from '../../lib/adminJwt';
import { fromJsonArray, toJsonArray } from '../../lib/json';
import { toSelfUser } from '../users/serialize';
import { deleteAccount } from '../users/service';
import { toDogDto } from '../dogs/serialize';
import {
  CreateAdminInput,
  CreatePlaceInput,
  UpdateEventInput,
  UpdatePlaceInput,
  UpdateUserInput,
  UpdateWalkInput,
} from './schema';

// ── pagination helper ───────────────────────────────────────────────────────

function paginate<T>(items: T[], total: number, page: number, pageSize: number) {
  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

// ── auth ─────────────────────────────────────────────────────────────────────

export async function adminLogin(email: string, password: string) {
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password');
  }
  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  const accessToken = signAdminToken(admin.id, admin.role);
  return { accessToken, admin: toAdminDto(admin) };
}

export async function getAdminById(id: string) {
  const admin = await prisma.adminUser.findUnique({ where: { id } });
  if (!admin) throw new HttpError(404, 'NOT_FOUND', 'Admin not found');
  return toAdminDto(admin);
}

function toAdminDto(admin: { id: string; email: string; displayName: string; role: string; createdAt: Date; lastLoginAt: Date | null }) {
  return {
    id: admin.id,
    email: admin.email,
    displayName: admin.displayName,
    role: admin.role,
    createdAt: admin.createdAt.toISOString(),
    lastLoginAt: admin.lastLoginAt?.toISOString() ?? undefined,
  };
}

// ── audit log ────────────────────────────────────────────────────────────────

export async function logAction(adminId: string, action: string, targetType: string, targetId: string, meta?: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: { adminId, action, targetType, targetId, meta: meta ? JSON.stringify(meta) : undefined },
  });
}

export async function listAuditLog(page: number, pageSize: number, targetType?: string) {
  const where = targetType ? { targetType } : {};
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { admin: { select: { displayName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);
  const items = rows.map((r) => ({
    id: r.id,
    adminName: r.admin.displayName,
    adminEmail: r.admin.email,
    action: r.action,
    targetType: r.targetType,
    targetId: r.targetId,
    meta: r.meta ? JSON.parse(r.meta) : undefined,
    createdAt: r.createdAt.toISOString(),
  }));
  return paginate(items, total, page, pageSize);
}

// ── dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const since = (days: number) => new Date(Date.now() - days * 86_400_000);
  const [
    userCount,
    activeUsers7d,
    suspendedCount,
    dogCount,
    walkCount,
    liveWalkCount,
    eventCount,
    matchCount,
    messageCount,
    placeCount,
    signupsRaw,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { updatedAt: { gte: since(7) } } }),
    prisma.user.count({ where: { status: { not: 'active' } } }),
    prisma.dog.count(),
    prisma.walk.count(),
    prisma.walk.count({ where: { status: 'live' } }),
    prisma.event.count(),
    prisma.match.count(),
    prisma.message.count(),
    prisma.place.count(),
    prisma.user.findMany({ where: { createdAt: { gte: since(29) } }, select: { createdAt: true } }),
  ]);

  // 30-day daily signup counts, oldest first, for a sparkline.
  const days: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: 0 });
  }
  const byDay = new Map(days.map((d) => [d.date, d]));
  for (const s of signupsRaw) {
    const key = s.createdAt.toISOString().slice(0, 10);
    const bucket = byDay.get(key);
    if (bucket) bucket.count += 1;
  }

  return {
    users: { total: userCount, active7d: activeUsers7d, suspended: suspendedCount },
    dogs: dogCount,
    walks: { total: walkCount, live: liveWalkCount },
    events: eventCount,
    matches: matchCount,
    messages: messageCount,
    places: placeCount,
    signupsByDay: days,
  };
}

// ── users ────────────────────────────────────────────────────────────────────

export async function listUsers(q: string | undefined, status: string | undefined, provider: string | undefined, page: number, pageSize: number) {
  const where = {
    ...(status ? { status } : {}),
    ...(provider ? { provider } : {}),
    ...(q ? { OR: [{ displayName: { contains: q } }, { email: { contains: q } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { _count: { select: { dogs: true, hostedWalks: true, walkEntries: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);
  const items = rows.map((u) => ({
    ...toSelfUser(u),
    provider: u.provider,
    status: u.status,
    dogCount: u._count.dogs,
    walksHosted: u._count.hostedWalks,
    walksJoined: u._count.walkEntries,
  }));
  return paginate(items, total, page, pageSize);
}

export async function getUserDetail(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      dogs: true,
      hostedWalks: { orderBy: { scheduledAt: 'desc' }, take: 10 },
      walkEntries: { include: { walk: true }, orderBy: { walk: { scheduledAt: 'desc' } }, take: 10 },
    },
  });
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'User not found');
  const matchCount = await prisma.match.count({ where: { OR: [{ userAId: id }, { userBId: id }] } });
  return {
    ...toSelfUser(user),
    provider: user.provider,
    status: user.status,
    dogs: user.dogs.map(toDogDto),
    hostedWalks: user.hostedWalks.map((w) => ({ id: w.id, title: w.title, status: w.status, scheduledAt: w.scheduledAt.toISOString() })),
    joinedWalks: user.walkEntries.map((e) => ({ id: e.walk.id, title: e.walk.title, status: e.walk.status, scheduledAt: e.walk.scheduledAt.toISOString() })),
    matchCount,
  };
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'User not found');
  const updated = await prisma.user.update({ where: { id }, data: input });
  if (updated.status !== 'active') {
    await prisma.refreshToken.deleteMany({ where: { userId: id } });
  }
  return { ...toSelfUser(updated), provider: updated.provider, status: updated.status };
}

// Shares the same cleanup as self-service account deletion (message reassignment, walk/event host handoff,
// Match/Swipe cleanup) rather than a bare prisma.user.delete — see users/service.ts's deleteAccount for why a
// plain delete leaves orphaned rows and destroys other people's walks/events.
export const deleteUser = deleteAccount;

// ── dogs ─────────────────────────────────────────────────────────────────────

export async function listDogs(q: string | undefined, ownerId: string | undefined, page: number, pageSize: number) {
  const where = {
    ...(ownerId ? { ownerId } : {}),
    ...(q ? { OR: [{ name: { contains: q } }, { breed: { contains: q } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.dog.findMany({
      where,
      include: {
        owner: { select: { id: true, displayName: true } },
        shelter: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.dog.count({ where }),
  ]);
  // A shelter's adoptable dog has no personal owner (see Dog.shelterId) — show the shelter's name instead.
  const items = rows.map((d) => ({ ...toDogDto(d), ownerName: d.owner?.displayName ?? d.shelter?.displayName ?? 'Unknown' }));
  return paginate(items, total, page, pageSize);
}

export async function deleteDog(id: string) {
  const dog = await prisma.dog.findUnique({ where: { id } });
  if (!dog) throw new HttpError(404, 'NOT_FOUND', 'Dog not found');
  await prisma.dog.delete({ where: { id } });
}

// ── walks ────────────────────────────────────────────────────────────────────

const walkListInclude = { host: { select: { id: true, displayName: true } }, _count: { select: { participants: true } } } as const;

export async function listWalks(q: string | undefined, status: string | undefined, page: number, pageSize: number) {
  const where = {
    ...(status ? { status } : {}),
    ...(q ? { OR: [{ title: { contains: q } }, { meetingPoint: { contains: q } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.walk.findMany({ where, include: walkListInclude, orderBy: { scheduledAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.walk.count({ where }),
  ]);
  const items = rows.map((w) => ({
    id: w.id,
    title: w.title,
    category: w.category,
    status: w.status,
    scheduledAt: w.scheduledAt.toISOString(),
    meetingPoint: w.meetingPoint,
    hostId: w.hostId,
    hostName: w.host.displayName,
    participantCount: w._count.participants,
    maxParticipants: w.maxParticipants,
  }));
  return paginate(items, total, page, pageSize);
}

export async function getWalkDetail(id: string) {
  const walk = await prisma.walk.findUnique({
    where: { id },
    include: { host: { select: { id: true, displayName: true, email: true } }, participants: { include: { user: { select: { id: true, displayName: true, email: true } } } } },
  });
  if (!walk) throw new HttpError(404, 'NOT_FOUND', 'Walk not found');
  return {
    id: walk.id,
    title: walk.title,
    description: walk.description ?? undefined,
    category: walk.category,
    status: walk.status,
    duration: walk.duration,
    scheduledAt: walk.scheduledAt.toISOString(),
    meetingPoint: walk.meetingPoint,
    meetingLat: walk.meetingLat,
    meetingLng: walk.meetingLng,
    maxParticipants: walk.maxParticipants,
    host: walk.host,
    participants: walk.participants.map((p) => p.user),
    createdAt: walk.createdAt.toISOString(),
  };
}

export async function updateWalk(id: string, input: UpdateWalkInput) {
  const walk = await prisma.walk.findUnique({ where: { id } });
  if (!walk) throw new HttpError(404, 'NOT_FOUND', 'Walk not found');
  const { scheduledAt, ...rest } = input;
  const updated = await prisma.walk.update({
    where: { id },
    data: { ...rest, ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}) },
  });
  return updated;
}

export async function deleteWalk(id: string) {
  const walk = await prisma.walk.findUnique({ where: { id } });
  if (!walk) throw new HttpError(404, 'NOT_FOUND', 'Walk not found');
  await prisma.walk.delete({ where: { id } });
}

// ── events ───────────────────────────────────────────────────────────────────

const eventListInclude = { organizer: { select: { id: true, displayName: true } }, _count: { select: { participants: true } } } as const;

export async function listEvents(q: string | undefined, status: string | undefined, page: number, pageSize: number) {
  const where = {
    ...(status ? { status } : {}),
    ...(q ? { OR: [{ title: { contains: q } }, { location: { contains: q } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.event.findMany({ where, include: eventListInclude, orderBy: { date: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.event.count({ where }),
  ]);
  const items = rows.map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    status: e.status,
    date: e.date.toISOString(),
    location: e.location,
    organizerId: e.organizerId,
    organizerName: e.organizer.displayName,
    participantCount: e._count.participants,
    maxParticipants: e.maxParticipants,
    emoji: e.emoji ?? undefined,
  }));
  return paginate(items, total, page, pageSize);
}

export async function getEventDetail(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: { organizer: { select: { id: true, displayName: true, email: true } }, participants: { include: { user: { select: { id: true, displayName: true, email: true } } } } },
  });
  if (!event) throw new HttpError(404, 'NOT_FOUND', 'Event not found');
  return {
    id: event.id,
    title: event.title,
    description: event.description ?? undefined,
    category: event.category,
    status: event.status,
    date: event.date.toISOString(),
    location: event.location,
    lat: event.lat,
    lng: event.lng,
    maxParticipants: event.maxParticipants,
    organizer: event.organizer,
    participants: event.participants.map((p) => p.user),
    createdAt: event.createdAt.toISOString(),
  };
}

export async function updateEvent(id: string, input: UpdateEventInput) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw new HttpError(404, 'NOT_FOUND', 'Event not found');
  const { date, ...rest } = input;
  return prisma.event.update({ where: { id }, data: { ...rest, ...(date ? { date: new Date(date) } : {}) } });
}

export async function deleteEvent(id: string) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw new HttpError(404, 'NOT_FOUND', 'Event not found');
  await prisma.event.delete({ where: { id } });
}

// ── places ───────────────────────────────────────────────────────────────────

function toPlaceDto(place: { id: string; name: string; category: string; address: string; lat: number; lng: number; rating: number; reviewCount: number; tags: string; isOpen: boolean; description: string | null; emoji: string | null }) {
  return {
    id: place.id,
    name: place.name,
    category: place.category,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
    rating: place.rating,
    reviewCount: place.reviewCount,
    tags: fromJsonArray(place.tags),
    isOpen: place.isOpen,
    description: place.description ?? undefined,
    emoji: place.emoji ?? undefined,
  };
}

export async function listPlaces(q: string | undefined, category: string | undefined, page: number, pageSize: number) {
  const where = {
    ...(category ? { category } : {}),
    ...(q ? { OR: [{ name: { contains: q } }, { address: { contains: q } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.place.findMany({ where, orderBy: { name: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.place.count({ where }),
  ]);
  return paginate(rows.map(toPlaceDto), total, page, pageSize);
}

export async function createPlace(input: CreatePlaceInput) {
  const place = await prisma.place.create({ data: { ...input, tags: toJsonArray(input.tags) } });
  return toPlaceDto(place);
}

export async function updatePlace(id: string, input: UpdatePlaceInput) {
  const place = await prisma.place.findUnique({ where: { id } });
  if (!place) throw new HttpError(404, 'NOT_FOUND', 'Place not found');
  const { tags, ...rest } = input;
  const updated = await prisma.place.update({ where: { id }, data: { ...rest, ...(tags ? { tags: toJsonArray(tags) } : {}) } });
  return toPlaceDto(updated);
}

export async function deletePlace(id: string) {
  const place = await prisma.place.findUnique({ where: { id } });
  if (!place) throw new HttpError(404, 'NOT_FOUND', 'Place not found');
  await prisma.place.delete({ where: { id } });
}

// ── messages (chat moderation) ──────────────────────────────────────────────

export async function listMessages(q: string | undefined, userId: string | undefined, walkId: string | undefined, page: number, pageSize: number) {
  const where = {
    ...(userId ? { senderId: userId } : {}),
    ...(walkId ? { walkId } : {}),
    ...(q ? { content: { contains: q } } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.message.findMany({
      where,
      include: { sender: { select: { id: true, displayName: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.message.count({ where }),
  ]);
  const items = rows.map((m) => ({
    id: m.id,
    roomId: m.roomId,
    walkId: m.walkId ?? undefined,
    senderId: m.senderId,
    senderName: m.sender.displayName,
    content: m.content,
    type: m.type,
    createdAt: m.createdAt.toISOString(),
  }));
  return paginate(items, total, page, pageSize);
}

export async function deleteMessage(id: string) {
  const message = await prisma.message.findUnique({ where: { id } });
  if (!message) throw new HttpError(404, 'NOT_FOUND', 'Message not found');
  await prisma.message.delete({ where: { id } });
}

// ── matches ──────────────────────────────────────────────────────────────────

export async function listMatches(q: string | undefined, page: number, pageSize: number) {
  // userAId/userBId are plain fields (no @relation on Match), so a name search
  // resolves matching user ids first, then filters matches by those ids.
  let where = {};
  if (q) {
    const matchingUsers = await prisma.user.findMany({ where: { displayName: { contains: q } }, select: { id: true } });
    const ids = matchingUsers.map((u) => u.id);
    where = { OR: [{ userAId: { in: ids } }, { userBId: { in: ids } }] };
  }
  const [rows, total] = await Promise.all([
    prisma.match.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.match.count({ where }),
  ]);
  const userIds = Array.from(new Set(rows.flatMap((m) => [m.userAId, m.userBId])));
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, displayName: true } });
  const nameOf = new Map(users.map((u) => [u.id, u.displayName]));
  const items = rows.map((m) => ({
    id: m.id,
    userAId: m.userAId,
    userAName: nameOf.get(m.userAId) ?? 'Unknown',
    userBId: m.userBId,
    userBName: nameOf.get(m.userBId) ?? 'Unknown',
    matchedAt: m.matchedAt.toISOString(),
    lastMessage: m.lastMessage ?? undefined,
    lastMessageAt: m.lastMessageAt.toISOString(),
  }));
  return paginate(items, total, page, pageSize);
}

export async function deleteMatch(id: string) {
  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) throw new HttpError(404, 'NOT_FOUND', 'Match not found');
  await prisma.match.delete({ where: { id } });
}

// ── uploads ──────────────────────────────────────────────────────────────────

export async function listUploads() {
  const dir = path.resolve(env.uploadDir);
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }
  const files = await Promise.all(
    entries
      .filter((name) => !name.startsWith('.'))
      .map(async (name) => {
        const stat = await fs.stat(path.join(dir, name));
        return { name, sizeBytes: stat.size, modifiedAt: stat.mtime.toISOString(), url: `${env.publicBaseUrl}/uploads/${name}` };
      }),
  );
  return files.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}

export async function deleteUpload(name: string) {
  if (name.includes('..') || name.includes('/')) throw new HttpError(400, 'INVALID_NAME', 'Invalid file name');
  const filePath = path.join(path.resolve(env.uploadDir), name);
  try {
    await fs.unlink(filePath);
  } catch {
    throw new HttpError(404, 'NOT_FOUND', 'File not found');
  }
}

// ── reports (moderation queue) ────────────────────────────────────────────────
// targetId is never a foreign key (see the schema comment on Report), so a report whose target has since been
// deleted still loads here — the admin UI just has nothing to link to for it.

export async function listReports(status: string | undefined, targetType: string | undefined, page: number, pageSize: number) {
  const where = {
    ...(status ? { status } : {}),
    ...(targetType ? { targetType } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: { reporter: { select: { id: true, displayName: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.report.count({ where }),
  ]);
  const items = rows.map((r) => ({
    id: r.id,
    reporterId: r.reporterId,
    reporterName: r.reporter.displayName,
    targetType: r.targetType,
    targetId: r.targetId,
    reason: r.reason,
    details: r.details ?? undefined,
    status: r.status,
    reviewedAt: r.reviewedAt?.toISOString(),
    createdAt: r.createdAt.toISOString(),
  }));
  return paginate(items, total, page, pageSize);
}

export async function updateReportStatus(id: string, status: string) {
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) throw new HttpError(404, 'NOT_FOUND', 'Report not found');
  const updated = await prisma.report.update({
    where: { id },
    data: { status, reviewedAt: status === 'open' ? null : new Date() },
  });
  return { id: updated.id, status: updated.status, reviewedAt: updated.reviewedAt?.toISOString() };
}

// ── admin accounts ───────────────────────────────────────────────────────────

export async function listAdmins() {
  const admins = await prisma.adminUser.findMany({ orderBy: { createdAt: 'asc' } });
  return admins.map(toAdminDto);
}

export async function createAdmin(input: CreateAdminInput) {
  const existing = await prisma.adminUser.findUnique({ where: { email: input.email } });
  if (existing) throw new HttpError(409, 'EMAIL_TAKEN', 'An admin with this email already exists');
  const passwordHash = await bcrypt.hash(input.password, 10);
  const admin = await prisma.adminUser.create({
    data: { email: input.email, passwordHash, displayName: input.displayName, role: input.role },
  });
  return toAdminDto(admin);
}

export async function deleteAdmin(id: string, requestingAdminId: string) {
  if (id === requestingAdminId) throw new HttpError(400, 'CANNOT_DELETE_SELF', 'You cannot remove your own account');
  const admin = await prisma.adminUser.findUnique({ where: { id } });
  if (!admin) throw new HttpError(404, 'NOT_FOUND', 'Admin not found');
  await prisma.adminUser.delete({ where: { id } });
}
