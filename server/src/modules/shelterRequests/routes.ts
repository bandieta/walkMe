import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { requireAuth } from '../../middleware/auth';
import { sendDogRequestMessageSchema } from './schema';
import { CHAT_NAMESPACE } from '../chat/socket';
import * as shelterRequestsService from './service';

export const shelterRequestsRouter = Router();
shelterRequestsRouter.use(requireAuth);

/**
 * @openapi
 * /dog-requests:
 *   get:
 *     summary: List the current user's shelter-dog requests — sent ones for a person, the inbox for a shelter.
 *     tags: [ShelterRequests]
 */
shelterRequestsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await shelterRequestsService.listForUser(req.userId!));
  }),
);

/**
 * @openapi
 * /dog-requests/{id}/accept:
 *   post:
 *     summary: Shelter accepts a request — opens the conversation for that dog.
 *     tags: [ShelterRequests]
 */
shelterRequestsRouter.post(
  '/:id/accept',
  asyncHandler(async (req, res) => {
    const request = await shelterRequestsService.acceptRequest(req.params.id, req.userId!);
    // Neither side's already-connected socket is in this request's room yet: chat/socket.ts only computes a
    // user's rooms once, at connect time, and this room didn't exist (or wasn't accepted) then. The requester
    // joins it explicitly by opening DogRequestChatScreen, but the shelter doesn't have to open the thread to
    // accept — they just tap Accept from the list — so without this, the *first* message sent right after
    // acceptance broadcasts to an empty room on the shelter's side: no live message, no toast (the socket-only
    // "chat:message:receive" is what drives both — see GlobalChatNotifier.tsx). socketsJoin against each
    // user's own per-user room (every socket already sits in one, see chat/socket.ts) reaches them without
    // needing a socket id. Subsequent messages already work once the shelter has opened the thread once, which
    // is why this only ever showed up as "the first chat".
    const io = req.app.get('io');
    io?.of(CHAT_NAMESPACE).in(request.requesterId).socketsJoin(request.id);
    io?.of(CHAT_NAMESPACE).in(request.shelterId).socketsJoin(request.id);
    res.json(request);
  }),
);

/**
 * @openapi
 * /dog-requests/{id}/decline:
 *   post:
 *     summary: Shelter declines a request.
 *     tags: [ShelterRequests]
 */
shelterRequestsRouter.post(
  '/:id/decline',
  asyncHandler(async (req, res) => {
    res.json(await shelterRequestsService.declineRequest(req.params.id, req.userId!));
  }),
);

/**
 * @openapi
 * /dog-requests/{id}/messages:
 *   get:
 *     summary: Get message history for a shelter-dog request.
 *     tags: [ShelterRequests]
 */
shelterRequestsRouter.get(
  '/:id/messages',
  asyncHandler(async (req, res) => {
    res.json(await shelterRequestsService.getMessages(req.params.id, req.userId!));
  }),
);

/**
 * @openapi
 * /dog-requests/{id}/messages:
 *   post:
 *     summary: Send a message on a shelter-dog request (only once the shelter has accepted it).
 *     tags: [ShelterRequests]
 */
shelterRequestsRouter.post(
  '/:id/messages',
  asyncHandler(async (req, res) => {
    const body = sendDogRequestMessageSchema.parse(req.body);
    const message = await shelterRequestsService.sendMessage(req.params.id, req.userId!, body.content, body.type);
    req.app.get('io')?.of(CHAT_NAMESPACE).to(req.params.id).emit('chat:message:receive', message);
    res.status(201).json(message);
  }),
);

/**
 * @openapi
 * /dog-requests/{id}/read:
 *   post:
 *     summary: Mark a shelter-dog request's messages as read.
 *     tags: [ShelterRequests]
 */
shelterRequestsRouter.post(
  '/:id/read',
  asyncHandler(async (req, res) => {
    await shelterRequestsService.markRead(req.params.id, req.userId!);
    res.json({ success: true });
  }),
);
