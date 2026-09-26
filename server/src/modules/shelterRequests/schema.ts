import { z } from 'zod';

export const sendDogRequestMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(['text', 'image']).default('text'),
});
