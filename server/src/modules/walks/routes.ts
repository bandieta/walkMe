import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { requireAuth } from '../../middleware/auth';
import { createWalkSchema, joinWalkSchema, nearbyQuerySchema, updateWalkStatusSchema } from './schema';
import * as walksService from './service';

export const walksRouter = Router();
walksRouter.use(requireAuth);

/**
 * @openapi
 * /walks:
 *   get:
 *     summary: List walks, optionally filtered to a radius around lat/lng.
 *     tags: [Walks]
 */
walksRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = nearbyQuerySchema.parse(req.query);
    const near =
      query.lat !== undefined && query.lng !== undefined
        ? { lat: query.lat, lng: query.lng, radiusKm: query.radiusKm ?? 20 }
        : undefined;
    res.json(await walksService.listWalks(near));
  }),
);

/**
 * @openapi
 * /walks/{id}:
 *   get:
 *     summary: Get a single walk.
 *     tags: [Walks]
 */
walksRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await walksService.getWalkById(req.params.id));
  }),
);

/**
 * @openapi
 * /walks:
 *   post:
 *     summary: Create a walk (creator is auto-joined as host).
 *     tags: [Walks]
 */
walksRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createWalkSchema.parse(req.body);
    res.status(201).json(await walksService.createWalk(req.userId!, body));
  }),
);

/**
 * @openapi
 * /walks/{id}/join:
 *   post:
 *     summary: Join a walk.
 *     tags: [Walks]
 */
walksRouter.post(
  '/:id/join',
  asyncHandler(async (req, res) => {
    const body = joinWalkSchema.parse(req.body ?? {});
    res.json(await walksService.joinWalk(req.params.id, req.userId!, body.dogId));
  }),
);

/**
 * @openapi
 * /walks/{id}/leave:
 *   post:
 *     summary: Leave a walk.
 *     tags: [Walks]
 */
walksRouter.post(
  '/:id/leave',
  asyncHandler(async (req, res) => {
    res.json(await walksService.leaveWalk(req.params.id, req.userId!));
  }),
);

/**
 * @openapi
 * /walks/{id}/status:
 *   patch:
 *     summary: Change a walk's status (host only).
 *     tags: [Walks]
 */
walksRouter.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const body = updateWalkStatusSchema.parse(req.body);
    res.json(await walksService.updateWalkStatus(req.params.id, req.userId!, body.status));
  }),
);
