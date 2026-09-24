import type { TFunction } from 'i18next';
import type { IconName } from '../../components/Icon';

/**
 * The map is centred on the user's neighbourhood (Mokotów, Warsaw) until device geolocation is wired in;
 * distances shown in the lists are measured from here.
 */
export const HOME = { latitude: 52.2166, longitude: 21.0164 };

export interface LatLng {
  latitude: number;
  longitude: number;
}

export function distanceKm(a: LatLng, lat: number, lng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat - a.latitude);
  const dLng = toRad(lng - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const weekday = (t: TFunction, d: Date) => t(`common.weekdaysShort.${WEEKDAY_KEYS[d.getDay()]}`);
const month = (t: TFunction, d: Date) => t(`common.monthsShort.${MONTH_KEYS[d.getMonth()]}`);

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export const isToday = (iso: string) => sameDay(new Date(iso), new Date());
const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** "Today · 09:15" / "Thu 25 Sep · 09:00" — the preview card's long form. */
export function whenLong(t: TFunction, iso: string): string {
  const d = new Date(iso);
  return sameDay(d, new Date()) ? `${t('common.today')} · ${hhmm(d)}` : `${weekday(t, d)} ${d.getDate()} ${month(t, d)} · ${hhmm(d)}`;
}

/** Walk rows: "Live now", "In 2 h", "Tomorrow", "Fri". */
export function walkWhen(t: TFunction, iso: string, status?: string): string {
  if (status === 'live') return t('common.liveNow');
  if (status === 'ended') return t('common.ended');
  const now = new Date();
  const d = new Date(iso);
  if (sameDay(d, now)) {
    const mins = (d.getTime() - now.getTime()) / 60000;
    if (mins <= 0) return t('common.today');
    return mins < 60 ? t('common.inMinutes', { count: Math.max(1, Math.round(mins)) }) : t('common.inHours', { count: Math.round(mins / 60) });
  }
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (sameDay(d, tomorrow)) return t('common.tomorrow');
  const days = (d.getTime() - now.getTime()) / 86400000;
  return days < 7 ? weekday(t, d) : `${d.getDate()} ${month(t, d)}`;
}

/** Event rows: "Today", "Fri 26", "Wed 1 Oct" (month only when it isn't the current one). */
export function eventWhen(t: TFunction, iso: string, status?: string): string {
  const now = new Date();
  const d = new Date(iso);
  if (status === 'live' || sameDay(d, now)) return t('common.today');
  const monthPart = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() ? '' : ` ${month(t, d)}`;
  return `${weekday(t, d)} ${d.getDate()}${monthPart}`;
}

const CATEGORY_ICON: Record<string, IconName> = {
  park: 'tree', trail: 'tree-evergreen', lake: 'waves', beach: 'umbrella-simple', cafe: 'coffee', 'café': 'coffee',
  city: 'buildings', meetup: 'users-three', playdate: 'dog', competition: 'trophy', wellness: 'flower-lotus',
  walk: 'moon-stars', vet: 'first-aid', store: 'store',
};

export function categoryGlyph(category: string | undefined, fallback: IconName): IconName {
  return CATEGORY_ICON[(category ?? '').trim().toLowerCase()] ?? fallback;
}

export type Segment = 'walks' | 'events' | 'places';

export interface MapItem {
  id: string;
  lat: number;
  lng: number;
  icon: IconName;
  live: boolean;
  /** Label under a live pin. */
  tag: string;
  title: string;
  sub: string;
  /** Preview-card subtitle. */
  pv: string;
  cta: string;
  act: () => void;
}
