import { appleAuth } from '@invertase/react-native-apple-authentication';

/**
 * Returns the Apple identity token to send to POST /auth/social, plus a
 * displayName Apple gives you only on the user's very first authorization
 * (fullName is empty on every sign-in after that — the server keeps
 * whatever name it saw the first time).
 */
export async function signInWithApple(): Promise<{ token: string; displayName?: string } | null> {
  const response = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
  });

  if (!response.identityToken) return null;

  const displayName = [response.fullName?.givenName, response.fullName?.familyName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return { token: response.identityToken, displayName: displayName || undefined };
}
