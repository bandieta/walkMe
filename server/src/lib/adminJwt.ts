import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AdminTokenPayload {
  sub: string; // admin id
  role: string; // "admin" | "superadmin"
}

export function signAdminToken(adminId: string, role: string): string {
  return jwt.sign({ sub: adminId, role } satisfies AdminTokenPayload, env.jwtAdminSecret, {
    expiresIn: env.jwtAdminExpiresIn,
  } as jwt.SignOptions);
}

export function verifyAdminToken(token: string): AdminTokenPayload {
  return jwt.verify(token, env.jwtAdminSecret) as AdminTokenPayload;
}
