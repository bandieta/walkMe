import { z } from 'zod';

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** Shared list-query shape: free-text search + page/pageSize, coerced from query-string values. */
const pageParams = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};

export const userQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(['active', 'suspended', 'banned']).optional(),
  provider: z.enum(['google', 'facebook', 'apple', 'dev']).optional(),
  ...pageParams,
});
export type UserQuery = z.infer<typeof userQuerySchema>;

export const updateUserSchema = z.object({
  displayName: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  status: z.enum(['active', 'suspended', 'banned']).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const dogQuerySchema = z.object({
  q: z.string().trim().optional(),
  ownerId: z.string().optional(),
  ...pageParams,
});

export const walkQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(['upcoming', 'live', 'ended']).optional(),
  ...pageParams,
});

export const updateWalkSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['upcoming', 'live', 'ended']).optional(),
  scheduledAt: z.string().datetime().optional(),
  maxParticipants: z.coerce.number().int().min(1).optional(),
});
export type UpdateWalkInput = z.infer<typeof updateWalkSchema>;

export const eventQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(['upcoming', 'live', 'ended']).optional(),
  ...pageParams,
});

export const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['upcoming', 'live', 'ended']).optional(),
  date: z.string().datetime().optional(),
  maxParticipants: z.coerce.number().int().min(1).optional(),
});
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const placeQuerySchema = z.object({
  q: z.string().trim().optional(),
  category: z.string().optional(),
  ...pageParams,
});

export const createPlaceSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  address: z.string().min(1),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  rating: z.coerce.number().min(0).max(5).default(0),
  reviewCount: z.coerce.number().int().min(0).default(0),
  tags: z.array(z.string()).default([]),
  isOpen: z.boolean().default(true),
  description: z.string().optional(),
  emoji: z.string().optional(),
});
export type CreatePlaceInput = z.infer<typeof createPlaceSchema>;

export const updatePlaceSchema = createPlaceSchema.partial();
export type UpdatePlaceInput = z.infer<typeof updatePlaceSchema>;

export const messageQuerySchema = z.object({
  q: z.string().trim().optional(),
  userId: z.string().optional(),
  walkId: z.string().optional(),
  ...pageParams,
});

export const matchQuerySchema = z.object({
  q: z.string().trim().optional(),
  ...pageParams,
});

export const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1),
  role: z.enum(['admin', 'superadmin']).default('admin'),
});
export type CreateAdminInput = z.infer<typeof createAdminSchema>;

export const auditQuerySchema = z.object({
  targetType: z.string().optional(),
  ...pageParams,
});
