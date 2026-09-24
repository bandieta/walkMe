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

export const emailStartSchema = z.object({
  email: z.string().email(),
});
export type EmailStartInput = z.infer<typeof emailStartSchema>;

export const emailVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  // Only used the first time this email signs in — an existing account keeps its saved name.
  displayName: z.string().min(1).max(60).optional(),
});
export type EmailVerifyInput = z.infer<typeof emailVerifySchema>;
