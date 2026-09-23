import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { requireAuth } from '../../middleware/auth';
import { createEventSchema } from './schema';
import * as eventsService from './service';

export const eventsRouter = Router();
eventsRouter.use(requireAuth);

/**
 * @openapi
 * /events:
 *   get:
 *     summary: List community events.
 *     tags: [Events]
 */
eventsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await eventsService.listEvents(req.userId));
  }),
);

/**
 * @openapi
 * /events/{id}:
 *   get:
 *     summary: Get a single event.
 *     tags: [Events]
 */
eventsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await eventsService.getEventById(req.params.id, req.userId));
  }),
);

/**
 * @openapi
 * /events:
 *   post:
 *     summary: Create an event (organizer is auto-joined).
 *     tags: [Events]
 */
eventsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createEventSchema.parse(req.body);
    res.status(201).json(await eventsService.createEvent(req.userId!, body));
  }),
);

/**
 * @openapi
 * /events/{id}/join:
 *   post:
 *     summary: Join an event.
 *     tags: [Events]
 */
eventsRouter.post(
  '/:id/join',
  asyncHandler(async (req, res) => {
    res.json(await eventsService.joinEvent(req.params.id, req.userId!));
  }),
);

/**
 * @openapi
 * /events/{id}/leave:
 *   post:
 *     summary: Leave an event.
 *     tags: [Events]
 */
eventsRouter.post(
  '/:id/leave',
  asyncHandler(async (req, res) => {
    res.json(await eventsService.leaveEvent(req.params.id, req.userId!));
  }),
);
