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

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export const isToday = (iso: string) => sameDay(new Date(iso), new Date());
const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** "Today · 09:15" / "Thu 25 Sep · 09:00" — the preview card's long form. */
export function whenLong(iso: string): string {
  const d = new Date(iso);
  return sameDay(d, new Date()) ? `Today · ${hhmm(d)}` : `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} · ${hhmm(d)}`;
}

/** Walk rows: "Live now", "In 2 h", "Tomorrow", "Fri". */
export function walkWhen(iso: string, status?: string): string {
  if (status === 'live') return 'Live now';
  if (status === 'ended') return 'Ended';
  const now = new Date();
  const d = new Date(iso);
  if (sameDay(d, now)) {
    const mins = (d.getTime() - now.getTime()) / 60000;
    if (mins <= 0) return 'Today';
    return mins < 60 ? `In ${Math.max(1, Math.round(mins))} min` : `In ${Math.round(mins / 60)} h`;
  }
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (sameDay(d, tomorrow)) return 'Tomorrow';
  const days = (d.getTime() - now.getTime()) / 86400000;
  return days < 7 ? DAYS[d.getDay()] : `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Event rows: "Today", "Fri 26", "Wed 1 Oct" (month only when it isn't the current one). */
export function eventWhen(iso: string, status?: string): string {
  const now = new Date();
  const d = new Date(iso);
  if (status === 'live' || sameDay(d, now)) return 'Today';
  const month = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() ? '' : ` ${MONTHS[d.getMonth()]}`;
  return `${DAYS[d.getDay()]} ${d.getDate()}${month}`;
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
