import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).optional(),
  photoUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  age: z.number().int().min(13).max(120).optional(),
  location: z.string().max(120).optional(),
  // Set together, from a map pick (see mobile's LocationField/PickLocationScreen) — the app never sends one
  // without the other, so `location`'s text and these coordinates are always for the same point.
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  walkTimes: z.array(z.string()).max(8).optional(),
  radiusKm: z.number().min(0.5).max(50).optional(),
  onboarded: z.boolean().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
