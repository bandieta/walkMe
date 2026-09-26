import { z } from 'zod';

export const sendMatchMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(['text', 'image']).default('text'),
});

export const deckQuerySchema = z.object({
  energy: z.enum(['Calm', 'Balanced', 'High']).optional(),
  ageGroup: z.enum(['Puppy', 'Adult', 'Senior']).optional(),
  // z.coerce.boolean() would treat the string "false" as truthy (any non-empty string coerces to true), so this
  // matches against the literal query values instead.
  shelterOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  radiusKm: z.coerce.number().positive().optional(),
});
export type DeckQuery = z.infer<typeof deckQuerySchema>;
