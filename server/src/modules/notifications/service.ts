import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';
import { NotificationCategory } from './schema';
import { toNotificationDto, toPreferencesDto } from './serialize';
import { emitNotification } from './socket';

/** Where the mobile app navigates on tap — a tab name plus a screen inside that tab's stack (the same
 * cross-tab `navigation.navigate(tab, { screen, params })` shape already used elsewhere in the app). */
export type NotifyTarget = { tab: 'MapTab' | 'ChatTab' | 'ProfileTab'; screen: string; params?: Record<string, unknown> };

export type NotificationType =
  | 'match'
  | 'message'
  | 'walk_joined'
  | 'walk_left'
  | 'walk_nearby'
  | 'event_joined'
  | 'shelter_request'
  | 'shelter_accepted'
  | 'shelter_declined';

const TYPE_CATEGORY: Record<NotificationType, NotificationCategory> = {
  match: 'matches',
  message: 'messages',
  walk_joined: 'walks',
  walk_left: 'walks',
  walk_nearby: 'nearby',
  event_joined: 'events',
  shelter_request: 'shelterRequests',
  shelter_accepted: 'shelterRequests',
  shelter_declined: 'shelterRequests',
};

// Plain-English copy stored on the row itself (handy from the admin panel, and a safety net for a client that
// doesn't recognise `type`). The mobile app's own notification center re-renders every row through i18n using
// `type` + `params` instead, so this text is never the thing a user actually sees in the app.
const FALLBACK_COPY: Record<NotificationType, (p: Record<string, string>) => { title: string; body: string }> = {
  match: (p) => ({ title: 'It’s a match!', body: `You and ${p.name} can now chat.` }),
  message: (p) => ({ title: p.name, body: p.preview }),
  walk_joined: (p) => ({ title: 'New walk guest', body: `${p.name} joined ${p.walkTitle}.` }),
  walk_left: (p) => ({ title: 'Someone left your walk', body: `${p.name} left ${p.walkTitle}.` }),
  walk_nearby: (p) => ({ title: 'New walk nearby', body: `“${p.walkTitle}” starts near ${p.meetingPoint}.` }),
  event_joined: (p) => ({ title: 'New attendee', body: `${p.name} joined ${p.eventTitle}.` }),
  shelter_request: (p) => ({ title: 'New walk request', body: `${p.name} wants to walk ${p.dogName}.` }),
  shelter_accepted: (p) => ({ title: 'Request accepted', body: `${p.shelterName} said yes — you can chat about ${p.dogName} now.` }),
  shelter_declined: (p) => ({ title: 'Request declined', body: `${p.shelterName} declined your request for ${p.dogName}.` }),
};

export async function getPreferences(userId: string) {
  const pref = await prisma.notificationPreference.findUnique({ where: { userId } });
  return toPreferencesDto(pref);
}

export async function updatePreferences(userId: string, patch: Partial<Record<NotificationCategory, boolean>>) {
  const pref = await prisma.notificationPreference.upsert({
    where: { userId },
    update: patch,
    create: { userId, ...patch },
  });
  return toPreferencesDto(pref);
}

/**
 * The single entry point every feature calls to raise a notification. Looks up which preference category
 * `type` belongs to and, unless the user has switched that category off, persists the row and pushes it over
 * the socket. A disabled category means the notification is never created at all — not just hidden on the
 * client — so opting out is a real guarantee, not cosmetic.
 *
 * `params` carries the interpolation values the mobile app's i18n templates need (e.g. { name, walkTitle }) —
 * they're stored alongside `target` in the `data` column and are also used here to render the English
 * fallback `title`/`body` stored on the row (see FALLBACK_COPY).
 */
export async function notify(
  userId: string,
  type: NotificationType,
  params: Record<string, string>,
  target?: NotifyTarget,
) {
  const category = TYPE_CATEGORY[type];
  const pref = await prisma.notificationPreference.findUnique({ where: { userId } });
  const enabled = pref ? pref[category] : true;
  if (!enabled) return null;

  const { title, body } = FALLBACK_COPY[type](params);
  const notification = await prisma.notification.create({
    data: { userId, type, title, body, data: JSON.stringify({ params, target }) },
  });
  const dto = toNotificationDto(notification);
  emitNotification(userId, dto);
  return dto;
}

export async function list(userId: string, opts: { cursor?: string; limit?: number }) {
  const limit = opts.limit ?? 30;
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return {
    items: page.map(toNotificationDto),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

export async function unreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function markRead(id: string, userId: string) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== userId) {
    throw new HttpError(404, 'NOT_FOUND', 'Notification not found');
  }
  await prisma.notification.update({ where: { id }, data: { read: true } });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
}
