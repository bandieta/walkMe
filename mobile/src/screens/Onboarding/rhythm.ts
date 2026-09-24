import type { IconName } from '../../components/Icon';

/** The prototype's TIMES table: [key, label, range, icon]. Keys are what the API stores in `walkTimes`. */
export const WALK_TIMES: { key: string; label: string; range: string; icon: IconName }[] = [
  { key: 'early', label: 'Early', range: '06–08', icon: 'sun-horizon' },
  { key: 'morning', label: 'Morning', range: '08–11', icon: 'sun' },
  { key: 'midday', label: 'Midday', range: '11–15', icon: 'cloud-sun' },
  { key: 'afternoon', label: 'Afternoon', range: '15–17', icon: 'sun-dim' },
  { key: 'evening', label: 'Evening', range: '17–20', icon: 'moon' },
  { key: 'night', label: 'Night', range: '20–23', icon: 'moon-stars' },
];

export const DEFAULT_WALK_TIMES = ['morning', 'evening'];
export const DEFAULT_RADIUS_KM = 2;
export const MIN_RADIUS_KM = 0.5;
export const MAX_RADIUS_KM = 5;

/** The neighbourhood the map is centred on until device geolocation is wired in (see Map/mapFormat HOME). */
export const DEFAULT_AREA = 'Mokotów, Warsaw';

/** Slider steps are half a kilometre, between 0.5 and 5 km. */
export const snapRadius = (km: number | undefined | null): number => {
  if (typeof km !== 'number' || !Number.isFinite(km)) return DEFAULT_RADIUS_KM;
  return Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, Math.round(km * 2) / 2));
};

/** "2 km", "0.5 km" — the prototype's radiusLabel. */
export const radiusLabel = (km: number): string => `${km % 1 ? km.toFixed(1) : km} km`;

/** Keeps only known slots, in the design's order; falls back to the prototype default when nothing valid is stored. */
export const validTimes = (times: string[] | undefined | null): string[] => {
  const known = WALK_TIMES.map((t) => t.key).filter((k) => (times ?? []).includes(k));
  return known.length ? known : DEFAULT_WALK_TIMES;
};
