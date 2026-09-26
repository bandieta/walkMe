import { z } from 'zod';

export const createReportSchema = z.object({
  targetType: z.enum(['user', 'dog', 'walk', 'event', 'message']),
  targetId: z.string().min(1),
  reason: z.enum(['harassment', 'spam', 'fake_profile', 'inappropriate_content', 'safety_concern', 'other']),
  details: z.string().trim().max(1000).optional(),
});
export type CreateReportInput = z.infer<typeof createReportSchema>;
