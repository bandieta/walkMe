import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { requireAuth } from '../../middleware/auth';
import * as placesService from './service';

export const placesRouter = Router();
placesRouter.use(requireAuth);

/**
 * @openapi
 * /places:
 *   get:
 *     summary: List dog-friendly places.
 *     tags: [Places]
 */
placesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await placesService.listPlaces());
  }),
);

/**
 * @openapi
 * /places/{id}:
 *   get:
 *     summary: Get a single place.
 *     tags: [Places]
 */
placesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await placesService.getPlaceById(req.params.id));
  }),
);
