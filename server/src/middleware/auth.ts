import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Resolves an access token to a user that may still use the app. Access tokens are stateless and live for hours,
 * so the account's current status is checked on every call — a suspension or ban takes effect immediately.
 */
export async function authenticateAccessToken(
  token: string,
): Promise<{ ok: true; userId: string } | { ok: false; status: 401 | 403; code: string; message: string }> {
  let userId: string;
  try {
    userId = verifyAccessToken(token).sub;
  } catch {
    return { ok: false, status: 401, code: 'UNAUTHORIZED', message: 'Invalid or expired token' };
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
  if (!user) return { ok: false, status: 401, code: 'UNAUTHORIZED', message: 'Account no longer exists' };
  if (user.status !== 'active') {
    return { ok: false, status: 403, code: 'ACCOUNT_SUSPENDED', message: 'This account has been suspended' };
  }
  return { ok: true, userId };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing bearer token' } });
  }
  authenticateAccessToken(header.slice('Bearer '.length))
    .then((result) => {
      if (!result.ok) return res.status(result.status).json({ error: { code: result.code, message: result.message } });
      req.userId = result.userId;
      next();
    })
    .catch(next);
}
