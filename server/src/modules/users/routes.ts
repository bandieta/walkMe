import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { requireAuth } from '../../middleware/auth';
import { updateProfileSchema } from './schema';
import * as usersService from './service';
import * as dogsService from '../dogs/service';
import * as shelterRequestsService from '../shelterRequests/service';

export const usersRouter = Router();

usersRouter.use(requireAuth);

/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Get the current user's profile.
 *     tags: [Users]
 */
usersRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    res.json(await usersService.getUserById(req.userId!));
  }),
);

/**
 * @openapi
 * /users/me/stats:
 *   get:
 *     summary: Walks finished, walk friends and km together for the current user.
 *     tags: [Users]
 */
usersRouter.get(
  '/me/stats',
  asyncHandler(async (req, res) => {
    res.json(await usersService.getStats(req.userId!));
  }),
);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get a user's public profile.
 *     tags: [Users]
 */
usersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await usersService.getUserById(req.params.id));
  }),
);

/**
 * @openapi
 * /users/me:
 *   patch:
 *     summary: Update the current user's profile.
 *     tags: [Users]
 */
usersRouter.patch(
  '/me',
  asyncHandler(async (req, res) => {
    const body = updateProfileSchema.parse(req.body);
    res.json(await usersService.updateProfile(req.userId!, body));
  }),
);

/**
 * @openapi
 * /users/me/fcm-token:
 *   post:
 *     summary: Register a push notification token (stub for now).
 *     tags: [Users]
 */
usersRouter.post('/me/fcm-token', (_req, res) => {
  res.json({ success: true });
});

/**
 * @openapi
 * /users/me/dogs:
 *   get:
 *     summary: List the current user's dogs.
 *     tags: [Dogs]
 */
usersRouter.get(
  '/me/dogs',
  asyncHandler(async (req, res) => {
    res.json(await dogsService.getDogsForUser(req.userId!));
  }),
);

/**
 * @openapi
 * /users/{id}/dogs:
 *   get:
 *     summary: List a user's dogs.
 *     tags: [Dogs]
 */
usersRouter.get(
  '/:id/dogs',
  asyncHandler(async (req, res) => {
    res.json(await dogsService.getDogsForUser(req.params.id));
  }),
);

/**
 * @openapi
 * /users/me/walkable-dogs:
 *   get:
 *     summary: Dogs the current user can bring on a walk — their own, plus any shelter dog they're approved to walk.
 *     tags: [Dogs]
 */
usersRouter.get(
  '/me/walkable-dogs',
  asyncHandler(async (req, res) => {
    res.json(await shelterRequestsService.getWalkableDogs(req.userId!));
  }),
);
