import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { AUTH_CONFIG } from '../../utils/authConfig';

let configured = false;

function ensureConfigured() {
  if (configured) return;
  GoogleSignin.configure({ webClientId: AUTH_CONFIG.GOOGLE_WEB_CLIENT_ID, offlineAccess: false });
  configured = true;
}

/** Returns the Google ID token to send to POST /auth/social, or null if the user cancelled. */
export async function signInWithGoogle(): Promise<string | null> {
  ensureConfigured();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();
    // v11 returns { type: 'success', data: { idToken, user } } | { type: 'cancelled' }
    if ((result as any).type === 'cancelled') return null;
    const idToken = (result as any).data?.idToken ?? (result as any).idToken;
    if (!idToken) throw new Error('Google Sign-In did not return an idToken');
    return idToken;
  } catch (err: any) {
    if (err?.code === statusCodes.SIGN_IN_CANCELLED) return null;
    throw err;
  }
}
