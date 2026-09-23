import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Downloads an image (e.g. a Facebook profile photo) into the uploads folder
 * and returns its server-relative path. Provider CDN URLs are signed and
 * expire, so we keep our own copy. Returns null on any failure so callers can
 * fall back to the original URL.
 */
export async function saveRemoteImage(url: string, basename: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const contentType = (response.headers.get('content-type') ?? '').split(';')[0].trim();
    const extension = EXTENSIONS[contentType];
    if (!extension) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_BYTES) return null;

    const dir = path.resolve(env.uploadDir);
    fs.mkdirSync(dir, { recursive: true });
    // Deterministic name: a re-login overwrites the old copy instead of piling up files.
    const filename = `${basename.replace(/[^a-zA-Z0-9_-]/g, '')}${extension}`;
    fs.writeFileSync(path.join(dir, filename), bytes);
    return `/uploads/${filename}`;
  } catch {
    return null;
  }
}
