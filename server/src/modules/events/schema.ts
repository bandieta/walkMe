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
  // Dogs the organizer is bringing — same "own or shelter-approved" dogs as joinEventSchema below.
  dogIds: z.array(z.string()).max(10).optional(),
});
export type CreateEventInput = z.infer<typeof createEventSchema>;

export const joinEventSchema = z.object({
  // The dogs this participant is bringing. Calling join again (already a participant) replaces this list —
  // that's how "edit my dogs" works, rather than a separate endpoint.
  dogIds: z.array(z.string()).max(10).optional(),
});
export type JoinEventInput = z.infer<typeof joinEventSchema>;
