import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';
import { toPlaceDto } from './serialize';

export async function listPlaces() {
  const places = await prisma.place.findMany({ orderBy: { name: 'asc' } });
  return places.map(toPlaceDto);
}

export async function getPlaceById(id: string) {
  const place = await prisma.place.findUnique({ where: { id } });
  if (!place) throw new HttpError(404, 'NOT_FOUND', 'Place not found');
  return toPlaceDto(place);
}
