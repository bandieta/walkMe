import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { requireAuth } from '../../middleware/auth';
import { createDogSchema, updateDogSchema } from './schema';
import * as dogsService from './service';

export const dogsRouter = Router();
dogsRouter.use(requireAuth);

/**
 * @openapi
 * /dogs:
 *   post:
 *     summary: Add a dog to the current user's profile.
 *     tags: [Dogs]
 */
dogsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createDogSchema.parse(req.body);
    res.status(201).json(await dogsService.createDog(req.userId!, body));
  }),
);

/**
 * @openapi
 * /dogs/{id}:
 *   patch:
 *     summary: Update one of the current user's dogs.
 *     tags: [Dogs]
 */
dogsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const body = updateDogSchema.parse(req.body);
    res.json(await dogsService.updateDog(req.params.id, req.userId!, body));
  }),
);

/**
 * @openapi
 * /dogs/{id}:
 *   delete:
 *     summary: Remove one of the current user's dogs.
 *     tags: [Dogs]
 */
dogsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await dogsService.deleteDog(req.params.id, req.userId!);
    res.json({ success: true });
  }),
);
