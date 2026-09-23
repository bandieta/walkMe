import { z } from 'zod';

export const socialLoginSchema = z.object({
  provider: z.enum(['google', 'facebook', 'apple']),
  token: z.string().min(1),
  displayName: z.string().min(1).optional(),
});
export type SocialLoginInput = z.infer<typeof socialLoginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

export const devLoginSchema = z.object({
  displayName: z.string().min(1).default('Test User'),
  email: z.string().email().optional(),
});
