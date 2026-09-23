import { env } from '../../../config/env';
import { HttpError } from '../../../middleware/errorHandler';
import type { VerifiedProfile } from './google';

const GRAPH = 'https://graph.facebook.com';

async function graphGet(path: string, params: Record<string, string>) {
  const url = new URL(`${GRAPH}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  try {
    return await fetch(url);
  } catch {
    throw new HttpError(502, 'PROVIDER_UNAVAILABLE', 'Could not reach Facebook Graph API');
  }
}

/**
 * With FACEBOOK_APP_ID + FACEBOOK_APP_SECRET configured, asks Facebook who the
 * token was issued to and rejects tokens from other apps.
 */
async function assertTokenBelongsToThisApp(accessToken: string) {
  if (!env.facebookAppId || !env.facebookAppSecret) return;
  const response = await graphGet('/debug_token', {
    input_token: accessToken,
    access_token: `${env.facebookAppId}|${env.facebookAppSecret}`,
  });
  if (!response.ok) {
    throw new HttpError(401, 'INVALID_TOKEN', 'Facebook token verification failed');
  }
  const { data } = (await response.json()) as { data?: { app_id?: string; is_valid?: boolean } };
  if (!data?.is_valid || data.app_id !== env.facebookAppId) {
    throw new HttpError(401, 'INVALID_TOKEN', 'Facebook token was not issued for this app');
  }
}

/** Verifies a Facebook access token (from the SDK's AccessToken.getCurrentAccessToken()). */
export async function verifyFacebookToken(accessToken: string): Promise<VerifiedProfile> {
  await assertTokenBelongsToThisApp(accessToken);

  const response = await graphGet('/me', {
    fields: 'id,name,email,picture.width(400).height(400)',
    access_token: accessToken,
  });
  if (!response.ok) {
    throw new HttpError(401, 'INVALID_TOKEN', 'Facebook token verification failed');
  }
  const data = (await response.json()) as {
    id: string;
    name?: string;
    email?: string;
    picture?: { data?: { url?: string } };
  };
  return {
    providerId: data.id,
    email: data.email,
    displayName: data.name ?? data.email ?? 'Facebook User',
    photoUrl: data.picture?.data?.url,
  };
}
