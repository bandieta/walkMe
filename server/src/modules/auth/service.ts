import { prisma } from '../../lib/prisma';
import { generateRefreshToken, hashToken, refreshTokenExpiryDate, signAccessToken } from '../../lib/jwt';
import { HttpError } from '../../middleware/errorHandler';
import { toPublicUser } from '../users/serialize';
import { verifyGoogleToken } from './verifiers/google';
import { verifyFacebookToken } from './verifiers/facebook';
import { verifyAppleToken } from './verifiers/apple';
import type { VerifiedProfile } from './verifiers/google';

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

async function upsertUserFromProfile(provider: string, profile: VerifiedProfile) {
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
    },
  });
  return user;
}

export async function socialLogin(provider: 'google' | 'facebook' | 'apple', token: string, displayName?: string) {
  const profile =
    provider === 'google'
      ? await verifyGoogleToken(token)
      : provider === 'facebook'
        ? await verifyFacebookToken(token)
        : await verifyAppleToken(token, displayName);

  const user = await upsertUserFromProfile(provider, profile);
  const tokens = await issueTokenPair(user.id);
  return { user: toPublicUser(user), ...tokens };
}

export async function devLogin(displayName: string, email?: string) {
  // A stable dev user per display name so repeated dev logins reuse the same account.
  const providerId = `dev-${displayName.toLowerCase().replace(/\s+/g, '-')}`;
  const user = await prisma.user.upsert({
    where: { provider_providerId: { provider: 'dev', providerId } },
    update: {},
    create: { provider: 'dev', providerId, displayName, email },
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
