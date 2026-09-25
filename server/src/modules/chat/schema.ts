import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(['text', 'image']).default('text'),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
