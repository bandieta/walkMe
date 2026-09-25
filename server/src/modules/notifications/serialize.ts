import { Notification, NotificationPreference } from '@prisma/client';
import { NotificationCategory } from './schema';

export function toNotificationDto(n: Notification) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    data: n.data ? JSON.parse(n.data) : undefined,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  };
}

const DEFAULTS: Record<NotificationCategory, boolean> = {
  matches: true,
  messages: true,
  walks: true,
  events: true,
  shelterRequests: true,
  nearby: true,
};

/** No row yet means the user has never touched their settings — everything defaults to on. */
export function toPreferencesDto(pref: NotificationPreference | null) {
  if (!pref) return { ...DEFAULTS };
  return {
    matches: pref.matches,
    messages: pref.messages,
    walks: pref.walks,
    events: pref.events,
    shelterRequests: pref.shelterRequests,
    nearby: pref.nearby,
  };
}
