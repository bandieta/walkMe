import { z } from 'zod';

export const createWalkSchema = z.object({
  title: z.string().min(1),
  description: z.string().max(1000).optional(),
  category: z.string().default('Park'),
  meetingLat: z.number(),
  meetingLng: z.number(),
  meetingPoint: z.string().min(1),
  scheduledAt: z.string().datetime(),
  maxParticipants: z.number().int().positive().default(8),
  duration: z.string().default('1h'),
  // Which dog the host is bringing — their own, or one a shelter has approved them to walk. Optional.
  dogId: z.string().optional(),
});
export type CreateWalkInput = z.infer<typeof createWalkSchema>;

export const joinWalkSchema = z.object({
  dogId: z.string().optional(),
});
export type JoinWalkInput = z.infer<typeof joinWalkSchema>;

export const updateWalkStatusSchema = z.object({
  status: z.enum(['upcoming', 'live', 'ended']),
});

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().positive().default(20).optional(),
});
