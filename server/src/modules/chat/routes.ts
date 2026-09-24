import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { requireAuth } from '../../middleware/auth';
import { sendMessageSchema } from './schema';
import * as chatService from './service';
import { CHAT_NAMESPACE } from './socket';

export const chatRouter = Router();
chatRouter.use(requireAuth);

/**
 * @openapi
 * /chat/rooms:
 *   get:
 *     summary: List the current user's group chat rooms (one per joined walk).
 *     tags: [Chat]
 */
chatRouter.get(
  '/rooms',
  asyncHandler(async (req, res) => {
    res.json(await chatService.getRoomsForUser(req.userId!));
  }),
);

/**
 * @openapi
 * /chat/{roomId}/messages:
 *   get:
 *     summary: Get message history for a room (walkId or matchId).
 *     tags: [Chat]
 */
chatRouter.get(
  '/:roomId/messages',
  asyncHandler(async (req, res) => {
    res.json(await chatService.getMessages(req.params.roomId));
  }),
);

/**
 * @openapi
 * /chat/{roomId}/messages:
 *   post:
 *     summary: Send a message over REST (also broadcast via Socket.io).
 *     tags: [Chat]
 */
chatRouter.post(
  '/:roomId/messages',
  asyncHandler(async (req, res) => {
    const body = sendMessageSchema.parse(req.body);
    const message = await chatService.sendMessage(req.params.roomId, req.userId!, body.content, body.type);
    req.app.get('io')?.of(CHAT_NAMESPACE).to(req.params.roomId).emit('chat:message:receive', message);
    res.status(201).json(message);
  }),
);
