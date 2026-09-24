import { Router } from 'express';
import { asyncHandler, HttpError } from '../../middleware/errorHandler';
import { env } from '../../config/env';
import { devLoginSchema, emailStartSchema, emailVerifySchema, logoutSchema, refreshSchema, socialLoginSchema } from './schema';
import * as authService from './service';

export const authRouter = Router();

/**
 * @openapi
 * /auth/social:
 *   post:
 *     summary: Log in (or sign up) with a Google, Facebook, or Apple token obtained natively on the client.
 *     tags: [Auth]
 */
authRouter.post(
  '/social',
  asyncHandler(async (req, res) => {
    const body = socialLoginSchema.parse(req.body);
    const result = await authService.socialLogin(body.provider, body.token, body.displayName);
    res.json(result);
  }),
);

/**
 * @openapi
 * /auth/dev-login:
 *   post:
 *     summary: Dev-only login bypass (disabled unless ALLOW_DEV_LOGIN=true) for testing every other endpoint before real OAuth apps exist.
 *     tags: [Auth]
 */
authRouter.post(
  '/dev-login',
  asyncHandler(async (req, res) => {
    if (!env.allowDevLogin) {
      throw new HttpError(403, 'DEV_LOGIN_DISABLED', 'Dev login is disabled on this server');
    }
    const body = devLoginSchema.parse(req.body ?? {});
    const result = await authService.devLogin(body.displayName, body.email);
    res.json(result);
  }),
);

/**
 * @openapi
 * /auth/email/start:
 *   post:
 *     summary: Send a 6-digit sign-in code to an email address (works for both new and returning users).
 *     tags: [Auth]
 */
authRouter.post(
  '/email/start',
  asyncHandler(async (req, res) => {
    const body = emailStartSchema.parse(req.body);
    const result = await authService.startEmailAuth(body.email);
    res.json(result);
  }),
);

/**
 * @openapi
 * /auth/email/verify:
 *   post:
 *     summary: Verify the code from /auth/email/start and log in, creating the account on first use.
 *     tags: [Auth]
 */
authRouter.post(
  '/email/verify',
  asyncHandler(async (req, res) => {
    const body = emailVerifySchema.parse(req.body);
    const result = await authService.verifyEmailCode(body.email, body.code, body.displayName);
    res.json(result);
  }),
);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Exchange a refresh token for a new access/refresh token pair.
 *     tags: [Auth]
 */
authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const body = refreshSchema.parse(req.body);
    const result = await authService.refreshTokens(body.refreshToken);
    res.json(result);
  }),
);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Invalidate a refresh token.
 *     tags: [Auth]
 */
authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const body = logoutSchema.parse(req.body);
    await authService.logout(body.refreshToken);
    res.json({ success: true });
  }),
);
