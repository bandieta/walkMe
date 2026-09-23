import { LoginManager, AccessToken, Settings } from 'react-native-fbsdk-next';
import { AUTH_CONFIG } from '../../utils/authConfig';

let configured = false;

function ensureConfigured() {
  if (configured) return;
  // Native config (Info.plist / strings.xml + AndroidManifest) also carries
  // the App ID, but setting it here too makes the SDK usable even before
  // those placeholders are filled in with a real app.
  Settings.setAppID(AUTH_CONFIG.FACEBOOK_APP_ID);
  Settings.setClientToken(AUTH_CONFIG.FACEBOOK_CLIENT_TOKEN);
  Settings.initializeSDK();
  configured = true;
}

/** Returns the Facebook access token to send to POST /auth/social, or null if the user cancelled. */
export async function signInWithFacebook(): Promise<string | null> {
  ensureConfigured();
  const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
  if (result.isCancelled) return null;
  const data = await AccessToken.getCurrentAccessToken();
  if (!data?.accessToken) throw new Error('Facebook Login did not return an access token');
  return data.accessToken;
}
