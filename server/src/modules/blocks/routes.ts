import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { requireAuth } from '../../middleware/auth';
import * as blocksService from './service';

export const blocksRouter = Router();
blocksRouter.use(requireAuth);

/**
 * @openapi
 * /blocks:
 *   get:
 *     summary: List the people the current user has blocked.
 *     tags: [Blocks]
 */
blocksRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await blocksService.listBlocked(req.userId!));
  }),
);

/**
 * @openapi
 * /blocks/{userId}:
 *   put:
 *     summary: Block a user — hides each other in Discover, matches, dog-request threads and walk
 *       listings, and stops messaging in both directions, effective immediately.
 *     tags: [Blocks]
 */
blocksRouter.put(
  '/:userId',
  asyncHandler(async (req, res) => {
    res.json(await blocksService.blockUser(req.userId!, req.params.userId));
  }),
);

/**
 * @openapi
 * /blocks/{userId}:
 *   delete:
 *     summary: Unblock a user.
 *     tags: [Blocks]
 */
blocksRouter.delete(
  '/:userId',
  asyncHandler(async (req, res) => {
    res.json(await blocksService.unblockUser(req.userId!, req.params.userId));
  }),
);
