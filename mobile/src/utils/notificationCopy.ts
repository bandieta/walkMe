import { TFunction } from 'i18next';
import { IconName } from '../components/Icon';
import { AppNotification, NotificationType } from '../store/slices/notificationsSlice';

/**
 * Notifications are stored server-side as `type` + interpolation `params` rather than final text, so every
 * locale renders its own copy from the same row — see notifications/service.ts's FALLBACK_COPY comment for
 * why the server-stored title/body is English-only and not what the app actually shows.
 */
export function formatNotification(t: TFunction, n: AppNotification): { title: string; body: string } {
  const p = n.data?.params ?? {};
  switch (n.type) {
    case 'match':
      return { title: t('notifications.types.match.title'), body: t('notifications.types.match.body', { name: p.name }) };
    case 'message':
      return { title: p.name ?? n.title, body: p.preview ?? n.body };
    case 'walk_joined':
      return { title: t('notifications.types.walkJoined.title'), body: t('notifications.types.walkJoined.body', { name: p.name, walkTitle: p.walkTitle }) };
    case 'walk_left':
      return { title: t('notifications.types.walkLeft.title'), body: t('notifications.types.walkLeft.body', { name: p.name, walkTitle: p.walkTitle }) };
    case 'walk_nearby':
      return { title: t('notifications.types.walkNearby.title'), body: t('notifications.types.walkNearby.body', { walkTitle: p.walkTitle, meetingPoint: p.meetingPoint }) };
    case 'event_joined':
      return { title: t('notifications.types.eventJoined.title'), body: t('notifications.types.eventJoined.body', { name: p.name, eventTitle: p.eventTitle }) };
    case 'shelter_request':
      return { title: t('notifications.types.shelterRequest.title'), body: t('notifications.types.shelterRequest.body', { name: p.name, dogName: p.dogName }) };
    case 'shelter_accepted':
      return { title: t('notifications.types.shelterAccepted.title'), body: t('notifications.types.shelterAccepted.body', { shelterName: p.shelterName, dogName: p.dogName }) };
    case 'shelter_declined':
      return { title: t('notifications.types.shelterDeclined.title'), body: t('notifications.types.shelterDeclined.body', { shelterName: p.shelterName, dogName: p.dogName }) };
    default:
      return { title: n.title, body: n.body };
  }
}

const ICONS: Record<NotificationType, IconName> = {
  match: 'heart',
  message: 'chat-circle',
  walk_joined: 'path',
  walk_left: 'path',
  walk_nearby: 'map-pin',
  event_joined: 'calendar-plus',
  shelter_request: 'house',
  shelter_accepted: 'house',
  shelter_declined: 'house',
};

export function notificationIcon(type: NotificationType): IconName {
  return ICONS[type] ?? 'bell';
}
