import { z } from 'zod';

export const createDogSchema = z.object({
  name: z.string().min(1),
  breed: z.string().min(1),
  age: z.number().int().min(0).max(30),
  weight: z.number().positive().optional(),
  bio: z.string().max(500).optional(),
  emoji: z.string().optional(),
  personality: z.array(z.string()).default([]),
});
export type CreateDogInput = z.infer<typeof createDogSchema>;

export const updateDogSchema = createDogSchema.partial();
export type UpdateDogInput = z.infer<typeof updateDogSchema>;
