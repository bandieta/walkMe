import { ENV } from './env';

/**
 * The server stores its own uploads as relative paths (`/uploads/x.jpg`) so
 * they work from any client host (10.0.2.2 on the Android emulator, localhost
 * on iOS, a real domain in production). Absolute URLs pass through untouched.
 */
export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  return url.startsWith('/') ? `${ENV.SOCKET_URL}${url}` : url;
}
