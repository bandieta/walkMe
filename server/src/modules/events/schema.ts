import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().max(1000).optional(),
  date: z.string().datetime(),
  location: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  maxParticipants: z.number().int().positive().default(30),
  category: z.string().default('Meetup'),
  emoji: z.string().default('🎉'),
  photoCaption: z.string().max(200).optional(),
});
export type CreateEventInput = z.infer<typeof createEventSchema>;
