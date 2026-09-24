import { Request, Response, NextFunction } from 'express';
import { verifyAdminToken } from '../lib/adminJwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      adminId?: string;
      adminRole?: string;
    }
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing bearer token' } });
  }
  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyAdminToken(token);
    req.adminId = payload.sub;
    req.adminRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired admin session' } });
  }
}

/** Only "superadmin" may manage other admin accounts. */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.adminRole !== 'superadmin') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Superadmin only' } });
  }
  next();
}
