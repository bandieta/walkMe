import { Linking, Platform, Settings } from 'react-native';

export interface DevLaunch {
  login?: string;
  url?: string | null;
}

// Dev-only: lets scripts sign in and open a screen without tapping.
// iOS: `simctl launch ... -devLogin "Alex Johnson" -devUrl walkme://profile` (read via Settings).
// Android: `am start -a android.intent.action.VIEW -d "walkme://profile?devLogin=Alex%20Johnson"`.
export async function readDevLaunch(): Promise<DevLaunch> {
  if (!__DEV__) return {};
  if (Platform.OS === 'ios') {
    return { login: Settings.get('devLogin') || undefined, url: Settings.get('devUrl') || null };
  }
  const initial = await Linking.getInitialURL();
  if (!initial) return {};
  const match = /[?&]devLogin=([^&#]*)/.exec(initial);
  const login = match ? decodeURIComponent(match[1]) : undefined;
  const url = initial.replace(/([?&])devLogin=[^&#]*&?/, '$1').replace(/[?&]$/, '');
  return { login, url };
}
