import { z } from 'zod';

// Only used the first time an identity signs in — an existing account keeps whatever it was created with.
// A shelter account must have confirmed the "I confirm this represents a shelter/rescue" checkbox client-side;
// enforced here so the confirmation can't be skipped by calling the API directly.
const accountTypeFields = {
  accountType: z.enum(['person', 'shelter']).default('person'),
  shelterConfirmed: z.boolean().optional(),
};
const refineShelterConfirmed = (data: { accountType: string; shelterConfirmed?: boolean }) =>
  data.accountType !== 'shelter' || data.shelterConfirmed === true;
const shelterConfirmedIssue = {
  message: 'A shelter/organization account must confirm the shelter checkbox',
  path: ['shelterConfirmed'],
};

export const socialLoginSchema = z
  .object({
    provider: z.enum(['google', 'facebook', 'apple']),
    token: z.string().min(1),
    displayName: z.string().min(1).optional(),
    ...accountTypeFields,
  })
  .refine(refineShelterConfirmed, shelterConfirmedIssue);
export type SocialLoginInput = z.infer<typeof socialLoginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

export const devLoginSchema = z
  .object({
    displayName: z.string().min(1).default('Test User'),
    email: z.string().email().optional(),
    ...accountTypeFields,
  })
  .refine(refineShelterConfirmed, shelterConfirmedIssue);

export const emailStartSchema = z.object({
  email: z.string().email(),
});
export type EmailStartInput = z.infer<typeof emailStartSchema>;

export const emailVerifySchema = z
  .object({
    email: z.string().email(),
    code: z.string().length(6),
    // Only used the first time this email signs in — an existing account keeps its saved name.
    displayName: z.string().min(1).max(60).optional(),
    ...accountTypeFields,
  })
  .refine(refineShelterConfirmed, shelterConfirmedIssue);
export type EmailVerifyInput = z.infer<typeof emailVerifySchema>;
