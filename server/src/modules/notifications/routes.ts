import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { requireAuth } from '../../middleware/auth';
import { listNotificationsQuerySchema, updatePreferencesSchema } from './schema';
import * as notificationsService from './service';

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

/**
 * @openapi
 * /notifications:
 *   get:
 *     summary: List the current user's in-app notifications, newest first.
 *     tags: [Notifications]
 */
notificationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listNotificationsQuerySchema.parse(req.query);
    res.json(await notificationsService.list(req.userId!, query));
  }),
);

/**
 * @openapi
 * /notifications/unread-count:
 *   get:
 *     summary: Unread notification count, for the bell badge.
 *     tags: [Notifications]
 */
notificationsRouter.get(
  '/unread-count',
  asyncHandler(async (req, res) => {
    res.json({ count: await notificationsService.unreadCount(req.userId!) });
  }),
);

/**
 * @openapi
 * /notifications/read-all:
 *   post:
 *     summary: Mark every notification as read.
 *     tags: [Notifications]
 */
notificationsRouter.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    await notificationsService.markAllRead(req.userId!);
    res.json({ success: true });
  }),
);

/**
 * @openapi
 * /notifications/preferences:
 *   get:
 *     summary: Get the current user's per-category notification preferences.
 *     tags: [Notifications]
 */
notificationsRouter.get(
  '/preferences',
  asyncHandler(async (req, res) => {
    res.json(await notificationsService.getPreferences(req.userId!));
  }),
);

/**
 * @openapi
 * /notifications/preferences:
 *   put:
 *     summary: Update one or more notification categories.
 *     tags: [Notifications]
 */
notificationsRouter.put(
  '/preferences',
  asyncHandler(async (req, res) => {
    const patch = updatePreferencesSchema.parse(req.body);
    res.json(await notificationsService.updatePreferences(req.userId!, patch));
  }),
);

/**
 * @openapi
 * /notifications/{id}/read:
 *   post:
 *     summary: Mark a single notification as read.
 *     tags: [Notifications]
 */
notificationsRouter.post(
  '/:id/read',
  asyncHandler(async (req, res) => {
    await notificationsService.markRead(req.params.id, req.userId!);
    res.json({ success: true });
  }),
);
