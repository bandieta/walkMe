import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../../../config/env';
import { HttpError } from '../../../middleware/errorHandler';
import type { VerifiedProfile } from './google';

const APPLE_ISSUER = 'https://appleid.apple.com';
const jwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

/**
 * Verifies an Apple identity token (obtained client-side via
 * @invertase/react-native-apple-authentication's performRequest()).
 * Apple's token carries no name/picture — the client sends `displayName`
 * on first sign-in only (Apple gives it once, at authorization time).
 */
export async function verifyAppleToken(identityToken: string, displayName?: string): Promise<VerifiedProfile> {
  let payload;
  try {
    ({ payload } = await jwtVerify(identityToken, jwks, {
      issuer: APPLE_ISSUER,
      audience: env.appleBundleId,
    }));
  } catch {
    throw new HttpError(401, 'INVALID_TOKEN', 'Apple token verification failed');
  }
  const sub = payload.sub;
  if (!sub) {
    throw new HttpError(401, 'INVALID_TOKEN', 'Apple token payload missing subject');
  }
  const email = typeof payload.email === 'string' ? payload.email : undefined;
  return {
    providerId: sub,
    email,
    displayName: displayName ?? email ?? 'Apple User',
  };
}
