import { randomInt } from 'crypto';
import { prisma } from '../../lib/prisma';
import { generateRefreshToken, hashToken, refreshTokenExpiryDate, signAccessToken } from '../../lib/jwt';
import { HttpError } from '../../middleware/errorHandler';
import { sendVerificationEmail } from '../../lib/email';
import { toPublicUser } from '../users/serialize';
import { verifyGoogleToken } from './verifiers/google';
import { verifyFacebookToken } from './verifiers/facebook';
import { verifyAppleToken } from './verifiers/apple';
import { saveRemoteImage } from '../../lib/remoteImage';
import type { VerifiedProfile } from './verifiers/google';

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;

async function issueTokenPair(userId: string) {
  const accessToken = signAccessToken(userId);
  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshTokenExpiryDate(),
    },
  });
  return { accessToken, refreshToken };
}

/** accountType/shelterConfirmed only ever apply to a brand-new account — an existing one keeps what it was created with. */
function accountTypeCreateFields(accountType: 'person' | 'shelter', shelterConfirmed?: boolean) {
  return {
    accountType,
    ...(accountType === 'shelter' && shelterConfirmed ? { shelterConfirmedAt: new Date() } : {}),
  };
}

async function upsertUserFromProfile(
  provider: string,
  profile: VerifiedProfile,
  accountType: 'person' | 'shelter',
  shelterConfirmed?: boolean,
) {
  if (provider === 'facebook' && profile.photoUrl) {
    const stored = await saveRemoteImage(profile.photoUrl, `fb-${profile.providerId}`);
    if (stored) profile = { ...profile, photoUrl: stored };
  }
  const user = await prisma.user.upsert({
    where: { provider_providerId: { provider, providerId: profile.providerId } },
    update: {
      email: profile.email,
      photoUrl: profile.photoUrl,
      ...(profile.displayName ? { displayName: profile.displayName } : {}),
    },
    create: {
      provider,
      providerId: profile.providerId,
      email: profile.email,
      displayName: profile.displayName,
      photoUrl: profile.photoUrl,
      ...accountTypeCreateFields(accountType, shelterConfirmed),
    },
  });
  return user;
}

export async function socialLogin(
  provider: 'google' | 'facebook' | 'apple',
  token: string,
  displayName?: string,
  accountType: 'person' | 'shelter' = 'person',
  shelterConfirmed?: boolean,
) {
  const profile =
    provider === 'google'
      ? await verifyGoogleToken(token)
      : provider === 'facebook'
        ? await verifyFacebookToken(token)
        : await verifyAppleToken(token, displayName);

  const user = await upsertUserFromProfile(provider, profile, accountType, shelterConfirmed);
  const tokens = await issueTokenPair(user.id);
  return { user: toPublicUser(user), ...tokens };
}

export async function devLogin(
  displayName: string,
  email?: string,
  accountType: 'person' | 'shelter' = 'person',
  shelterConfirmed?: boolean,
) {
  // A stable dev user per display name so repeated dev logins reuse the same account.
  const providerId = `dev-${displayName.toLowerCase().replace(/\s+/g, '-')}`;
  const user = await prisma.user.upsert({
    where: { provider_providerId: { provider: 'dev', providerId } },
    update: {},
    create: { provider: 'dev', providerId, displayName, email, ...accountTypeCreateFields(accountType, shelterConfirmed) },
  });
  const tokens = await issueTokenPair(user.id);
  return { user: toPublicUser(user), ...tokens };
}

/** Step 1 of email sign-in: mint a 6-digit code, store its hash, email it (or log it in dev — see lib/email.ts). */
export async function startEmailAuth(emailInput: string) {
  const email = emailInput.trim().toLowerCase();

  const recent = await prisma.emailVerification.findFirst({ where: { email }, orderBy: { createdAt: 'desc' } });
  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    throw new HttpError(429, 'TOO_SOON', 'Please wait a moment before requesting another code');
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
  // Only one code is ever valid at a time — an earlier unused one for this email stops working.
  await prisma.emailVerification.deleteMany({ where: { email } });
  await prisma.emailVerification.create({
    data: { email, codeHash: hashToken(code), expiresAt: new Date(Date.now() + CODE_TTL_MS) },
  });

  let sent: boolean;
  try {
    ({ sent } = await sendVerificationEmail(email, code));
  } catch {
    // Nothing was delivered, so don't leave a live code behind (it would also trip the resend cooldown).
    await prisma.emailVerification.deleteMany({ where: { email } });
    throw new HttpError(502, 'EMAIL_SEND_FAILED', "We couldn't send a code to this address. Please try again later or use a different email.");
  }
  // Only when the code truly wasn't emailed (no RESEND_API_KEY configured) — see lib/email.ts.
  // Never populated once real sending is configured, so this can't leak in a production deploy.
  return { success: true, ...(sent ? {} : { devCode: code }) };
}

/** Step 2: check the code, then create-or-reuse a `provider: "email"` account exactly like social/dev login do. */
export async function verifyEmailCode(
  emailInput: string,
  code: string,
  displayName?: string,
  accountType: 'person' | 'shelter' = 'person',
  shelterConfirmed?: boolean,
) {
  const email = emailInput.trim().toLowerCase();
  const verification = await prisma.emailVerification.findFirst({ where: { email }, orderBy: { createdAt: 'desc' } });

  if (!verification || verification.expiresAt < new Date()) {
    throw new HttpError(400, 'CODE_EXPIRED', 'That code has expired — request a new one');
  }
  if (verification.attempts >= MAX_ATTEMPTS) {
    throw new HttpError(429, 'TOO_MANY_ATTEMPTS', 'Too many incorrect attempts — request a new code');
  }
  if (verification.codeHash !== hashToken(code)) {
    await prisma.emailVerification.update({ where: { id: verification.id }, data: { attempts: { increment: 1 } } });
    throw new HttpError(400, 'INVALID_CODE', 'That code is incorrect');
  }

  await prisma.emailVerification.deleteMany({ where: { email } });

  const user = await prisma.user.upsert({
    where: { provider_providerId: { provider: 'email', providerId: email } },
    update: {},
    create: {
      provider: 'email',
      providerId: email,
      email,
      displayName: displayName?.trim() || email.split('@')[0],
      ...accountTypeCreateFields(accountType, shelterConfirmed),
    },
  });
  const tokens = await issueTokenPair(user.id);
  return { user: toPublicUser(user), ...tokens };
}

export async function refreshTokens(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findFirst({ where: { tokenHash } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new HttpError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired');
  }
  // Rotate: delete the old one, issue a new pair.
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) {
    throw new HttpError(401, 'INVALID_REFRESH_TOKEN', 'User no longer exists');
  }
  const tokens = await issueTokenPair(user.id);
  return { user: toPublicUser(user), ...tokens };
}

export async function logout(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.deleteMany({ where: { tokenHash } });
}
