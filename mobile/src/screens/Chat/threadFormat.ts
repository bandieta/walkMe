import type { TFunction } from 'i18next';

/** Initials as the prototype draws them: first letters of the first two words, upper-cased ("Karolina W." -> "KW"). */
export const initials = (name?: string) =>
  (name || '?').split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

export const firstName = (name?: string) => (name || '').split(' ')[0];

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * The short "when" of a walk that the thread header shows after "N going ·": "Live now", "In 2 h", "Tomorrow", "Fri", "Ended".
 * (The prototype stores these strings; here they are derived from the walk's status and start time.)
 */
export function walkWhen(t: TFunction, scheduledAt?: string, status?: string, now: Date = new Date()): string {
  if (status === 'live') return t('common.liveNow');
  if (status === 'ended' || status === 'completed') return t('common.ended');
  if (status === 'cancelled') return t('common.cancelled');
  if (!scheduledAt) return '';
  const at = new Date(scheduledAt);
  if (Number.isNaN(at.getTime())) return '';
  const minutes = Math.round((at.getTime() - now.getTime()) / 60000);
  if (sameDay(at, now)) {
    if (minutes <= 0) return t('common.startingNow');
    return minutes < 60 ? t('common.inMinutes', { count: minutes }) : t('common.inHours', { count: Math.round(minutes / 60) });
  }
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (sameDay(at, tomorrow)) return t('common.tomorrow');
  const days = (at.getTime() - now.getTime()) / 86400000;
  if (days > 0 && days < 7) return t(`common.weekdaysShort.${WEEKDAY_KEYS[at.getDay()]}`);
  return `${at.getDate()} ${t(`common.monthsShort.${MONTH_KEYS[at.getMonth()]}`)}`;
}

/** "0.8 km" for a distance in km with one decimal (as the prototype's demo data writes it). */
export const formatKm = (km?: number | null) => (km == null ? '' : `${Number.isInteger(km) ? km.toFixed(1) : km} km`);
