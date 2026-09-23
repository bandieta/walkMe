import { Place } from '@prisma/client';
import { fromJsonArray } from '../../lib/json';

export function toPlaceDto(place: Place) {
  return {
    id: place.id,
    name: place.name,
    category: place.category,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
    rating: place.rating,
    reviewCount: place.reviewCount,
    tags: fromJsonArray(place.tags),
    isOpen: place.isOpen,
    description: place.description ?? undefined,
    emoji: place.emoji ?? undefined,
  };
}
