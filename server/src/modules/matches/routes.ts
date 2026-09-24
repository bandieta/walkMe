import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { requireAuth } from '../../middleware/auth';
import { sendMatchMessageSchema } from './schema';
import * as matchesService from './service';
import { CHAT_NAMESPACE } from '../chat/socket';

export const matchesRouter = Router();
matchesRouter.use(requireAuth);

/**
 * @openapi
 * /matches:
 *   get:
 *     summary: List the current user's matches.
 *     tags: [Matches]
 */
matchesRouter.get(
  '/matches',
  asyncHandler(async (req, res) => {
    res.json(await matchesService.getMatchesForUser(req.userId!));
  }),
);

/**
 * @openapi
 * /matches/{id}/messages:
 *   get:
 *     summary: Get message history with a match.
 *     tags: [Matches]
 */
matchesRouter.get(
  '/matches/:id/messages',
  asyncHandler(async (req, res) => {
    res.json(await matchesService.getMatchMessages(req.params.id, req.userId!));
  }),
);

/**
 * @openapi
 * /matches/{id}/messages:
 *   post:
 *     summary: Send a direct message to a match.
 *     tags: [Matches]
 */
matchesRouter.post(
  '/matches/:id/messages',
  asyncHandler(async (req, res) => {
    const body = sendMatchMessageSchema.parse(req.body);
    const message = await matchesService.sendMatchMessage(req.params.id, req.userId!, body.content);
    req.app.get('io')?.of(CHAT_NAMESPACE).to(req.params.id).emit('chat:message:receive', message);
    res.status(201).json(message);
  }),
);

/**
 * @openapi
 * /matches/{id}/read:
 *   post:
 *     summary: Mark a match's messages as read.
 *     tags: [Matches]
 */
matchesRouter.post(
  '/matches/:id/read',
  asyncHandler(async (req, res) => {
    await matchesService.markMatchRead(req.params.id, req.userId!);
    res.json({ success: true });
  }),
);

/**
 * @openapi
 * /discover/deck:
 *   get:
 *     summary: Get the next batch of swipe candidates.
 *     tags: [Discover]
 */
matchesRouter.get(
  '/discover/deck',
  asyncHandler(async (req, res) => {
    res.json(await matchesService.getSwipeDeck(req.userId!));
  }),
);

/**
 * @openapi
 * /discover/{userId}/swipe-right:
 *   post:
 *     summary: Swipe right; matches if mutual.
 *     tags: [Discover]
 */
matchesRouter.post(
  '/discover/:userId/swipe-right',
  asyncHandler(async (req, res) => {
    res.json(await matchesService.swipe(req.userId!, req.params.userId, 'right'));
  }),
);

/**
 * @openapi
 * /discover/{userId}/swipe-left:
 *   post:
 *     summary: Swipe left, dismissing a candidate.
 *     tags: [Discover]
 */
matchesRouter.post(
  '/discover/:userId/swipe-left',
  asyncHandler(async (req, res) => {
    await matchesService.swipe(req.userId!, req.params.userId, 'left');
    res.json({ success: true });
  }),
);

/**
 * @openapi
 * /discover/reset:
 *   post:
 *     summary: Clear the current user's swipes so every candidate shows up again.
 *     tags: [Discover]
 */
matchesRouter.post(
  '/discover/reset',
  asyncHandler(async (req, res) => {
    res.json(await matchesService.resetSwipes(req.userId!));
  }),
);
