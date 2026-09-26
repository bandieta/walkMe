import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { requireAuth } from '../../middleware/auth';
import { createReportSchema } from './schema';
import * as reportsService from './service';

export const reportsRouter = Router();
reportsRouter.use(requireAuth);

/**
 * @openapi
 * /reports:
 *   post:
 *     summary: Report a user, dog, walk, event or message to moderators — lands in the admin panel's queue.
 *     tags: [Reports]
 */
reportsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createReportSchema.parse(req.body);
    res.status(201).json(await reportsService.createReport(req.userId!, body));
  }),
);
