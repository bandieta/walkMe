import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';
import { env } from '../config/env';

// Disabled in tests: the suite fires far more requests against a single shared instance in a few seconds than
// any real client would, and a shared in-memory store would otherwise make unrelated tests fail depending on
// run order. Every other environment (including local dev) gets real limits — better to notice a limit is too
// strict while developing than to find out only in production.
const noop: RequestHandler = (_req, _res, next) => next();

// express-rate-limit resolves its RequestHandler type against whichever @types/express-serve-static-core copy
// hoists to the root node_modules, which can be a different major version than this workspace's own @types/express
// (same cross-workspace mismatch already worked around for swagger-ui-express above in app.ts) — cast through
// unknown so app.ts can mount these next to routers typed against this workspace's Express.

/** Every /api/v1/* route: a generous per-IP ceiling against scripted abuse (mass swiping, spamming messages,
 * hammering the deck), well above anything a real user hits by tapping around the app. */
export const generalLimiter: RequestHandler = env.isTest
  ? noop
  : (rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false }) as unknown as RequestHandler);

/** /auth/*: credential stuffing and email-code brute-forcing are the actual threats here, so this is much
 * tighter than the general limit — a real user signing in or requesting a code a few times a minute never
 * comes close. */
export const authLimiter: RequestHandler = env.isTest
  ? noop
  : (rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again later.' } },
    }) as unknown as RequestHandler);

/** /storage/upload: uploads are comparatively expensive (disk + validation) and the obvious target for someone
 * trying to fill the disk or DoS the upload path. */
export const uploadLimiter: RequestHandler = env.isTest
  ? noop
  : (rateLimit({
      windowMs: 60 * 60 * 1000,
      limit: 30,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMITED', message: 'Too many uploads. Try again later.' } },
    }) as unknown as RequestHandler);
