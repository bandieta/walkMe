import { HttpError } from '../../../middleware/errorHandler';
import type { VerifiedProfile } from './google';

/**
 * Verifies a Facebook access token (obtained client-side via the Facebook SDK's
 * AccessToken.getCurrentAccessToken()) by asking Graph API for the profile it
 * belongs to — if Graph API accepts the token, it's valid.
 */
export async function verifyFacebookToken(accessToken: string): Promise<VerifiedProfile> {
  const url = new URL('https://graph.facebook.com/me');
  url.searchParams.set('fields', 'id,name,email,picture');
  url.searchParams.set('access_token', accessToken);

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new HttpError(502, 'PROVIDER_UNAVAILABLE', 'Could not reach Facebook Graph API');
  }
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
