import { z } from 'zod';

export const NOTIFICATION_CATEGORIES = ['matches', 'messages', 'walks', 'events', 'shelterRequests', 'nearby'] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const updatePreferencesSchema = z.object({
  matches: z.boolean().optional(),
  messages: z.boolean().optional(),
  walks: z.boolean().optional(),
  events: z.boolean().optional(),
  shelterRequests: z.boolean().optional(),
  nearby: z.boolean().optional(),
});

export const listNotificationsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
