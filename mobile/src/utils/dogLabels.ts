// The dog model's ageGroup/energy/personality values are fixed English strings — they're the wire format
// (server data, PATCH bodies, exact-match filters) and stay that way regardless of the app's language. These
// map each one to an i18n key so every screen that displays them (DogForm's pickers, MyDogsScreen, ProfileScreen,
// DogCard, ...) shows the same translated label without duplicating the mapping.
import type { TFunction } from 'i18next';

export const AGE_GROUP_KEYS: Record<string, string> = {
  Puppy: 'common.ageGroups.puppy',
  Adult: 'common.ageGroups.adult',
  Senior: 'common.ageGroups.senior',
};

export const ENERGY_KEYS: Record<string, string> = {
  Calm: 'common.energyLevels.calm',
  Balanced: 'common.energyLevels.balanced',
  High: 'common.energyLevels.high',
};

export const TEMPERAMENT_KEYS: Record<string, string> = {
  Friendly: 'dogs.temperaments.friendly',
  Playful: 'dogs.temperaments.playful',
  Calm: 'dogs.temperaments.calm',
  'Shy with big dogs': 'dogs.temperaments.shyWithBigDogs',
  'Loves fetch': 'dogs.temperaments.lovesFetch',
  'Pulls on leash': 'dogs.temperaments.pullsOnLeash',
  Swimmer: 'dogs.temperaments.swimmer',
};

export function ageGroupLabel(t: TFunction, value?: string | null): string {
  return value && AGE_GROUP_KEYS[value] ? t(AGE_GROUP_KEYS[value]) : value ?? '';
}

export function energyLabel(t: TFunction, value?: string | null): string {
  return value && ENERGY_KEYS[value] ? t(ENERGY_KEYS[value]) : value ?? '';
}

export function temperamentLabel(t: TFunction, value: string): string {
  return TEMPERAMENT_KEYS[value] ? t(TEMPERAMENT_KEYS[value]) : value;
}

/** MyDogsScreen/ProfileScreen's fallback when a dog has no explicit ageGroup: derive one from its numeric age. */
export function ageGroupFromAge(t: TFunction, age: number, ageGroup?: string | null): string {
  if (ageGroup) return ageGroupLabel(t, ageGroup);
  return t(age < 1 ? 'common.ageGroups.puppy' : age > 8 ? 'common.ageGroups.senior' : 'common.ageGroups.adult');
}
