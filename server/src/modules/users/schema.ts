import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).optional(),
  photoUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  age: z.number().int().min(13).max(120).optional(),
  location: z.string().max(120).optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
