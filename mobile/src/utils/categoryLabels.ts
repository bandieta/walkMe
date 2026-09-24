// Walk/event categories are fixed English strings server-side (stored, filtered, and used to pick a map-pin
// icon via mapFormat's categoryGlyph — keyed on the lowercased English value). Only the *displayed* label is
// translated; see utils/dogLabels.ts for the same pattern applied to a dog's ageGroup/energy/personality.
import type { TFunction } from 'i18next';

export const WALK_CATEGORY_KEYS: Record<string, string> = {
  Park: 'walks.categories.park',
  Trail: 'walks.categories.trail',
  Lake: 'walks.categories.lake',
  Beach: 'walks.categories.beach',
  'Café': 'walks.categories.cafe',
  City: 'walks.categories.city',
};

export const EVENT_CATEGORY_KEYS: Record<string, string> = {
  Meetup: 'events.categories.meetup',
  Playdate: 'events.categories.playdate',
  Competition: 'events.categories.competition',
  Wellness: 'events.categories.wellness',
  Walk: 'events.categories.walk',
};

export function walkCategoryLabel(t: TFunction, value: string): string {
  return WALK_CATEGORY_KEYS[value] ? t(WALK_CATEGORY_KEYS[value]) : value;
}

export function eventCategoryLabel(t: TFunction, value: string): string {
  return EVENT_CATEGORY_KEYS[value] ? t(EVENT_CATEGORY_KEYS[value]) : value;
}
