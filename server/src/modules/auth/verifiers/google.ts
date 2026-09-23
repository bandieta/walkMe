import { OAuth2Client } from 'google-auth-library';
import { env } from '../../../config/env';
import { HttpError } from '../../../middleware/errorHandler';

const client = new OAuth2Client();

export interface VerifiedProfile {
  providerId: string;
  email?: string;
  displayName: string;
  photoUrl?: string;
}

/** Verifies a Google ID token (obtained client-side via GoogleSignin.signIn()). */
export async function verifyGoogleToken(idToken: string): Promise<VerifiedProfile> {
  if (!env.googleClientId) {
    throw new HttpError(500, 'PROVIDER_NOT_CONFIGURED', 'GOOGLE_CLIENT_ID is not set on the server');
  }
  let ticket;
  try {
    ticket = await client.verifyIdToken({ idToken, audience: env.googleClientId });
  } catch {
    throw new HttpError(401, 'INVALID_TOKEN', 'Google token verification failed');
  }
  const payload = ticket.getPayload();
  if (!payload?.sub) {
    throw new HttpError(401, 'INVALID_TOKEN', 'Google token payload missing subject');
  }
  return {
    providerId: payload.sub,
    email: payload.email,
    displayName: payload.name ?? payload.email ?? 'Google User',
    photoUrl: payload.picture,
  };
}
