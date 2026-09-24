/** Initials as the prototype draws them: first letters of the first two words, upper-cased ("Karolina W." -> "KW"). */
export const initials = (name?: string) =>
  (name || '?').split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

export const firstName = (name?: string) => (name || '').split(' ')[0];

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/**
 * The short "when" of a walk that the thread header shows after "N going ·": "Live now", "In 2 h", "Tomorrow", "Fri", "Ended".
 * (The prototype stores these strings; here they are derived from the walk's status and start time.)
 */
export function walkWhen(scheduledAt?: string, status?: string, now: Date = new Date()): string {
  if (status === 'live') return 'Live now';
  if (status === 'ended' || status === 'completed') return 'Ended';
  if (status === 'cancelled') return 'Cancelled';
  if (!scheduledAt) return '';
  const at = new Date(scheduledAt);
  if (Number.isNaN(at.getTime())) return '';
  const minutes = Math.round((at.getTime() - now.getTime()) / 60000);
  if (sameDay(at, now)) {
    if (minutes <= 0) return 'Starting now';
    return minutes < 60 ? `In ${minutes} min` : `In ${Math.round(minutes / 60)} h`;
  }
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (sameDay(at, tomorrow)) return 'Tomorrow';
  const days = (at.getTime() - now.getTime()) / 86400000;
  if (days > 0 && days < 7) return at.toLocaleDateString('en-GB', { weekday: 'short' });
  return at.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** "0.8 km" for a distance in km with one decimal (as the prototype's demo data writes it). */
export const formatKm = (km?: number | null) => (km == null ? '' : `${Number.isInteger(km) ? km.toFixed(1) : km} km`);
