import request from 'supertest';
import { createApp } from '../src/app';

export const app = createApp();

export async function devLoginAs(displayName: string, email?: string) {
  const res = await request(app).post('/api/v1/auth/dev-login').send({ displayName, email });
  if (res.status !== 200) {
    throw new Error(`dev-login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body as { user: { id: string; displayName: string }; accessToken: string; refreshToken: string };
}

export function authHeader(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

let counter = 0;
export function unique(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}
