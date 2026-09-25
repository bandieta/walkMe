import express from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { openapiSpec } from './docs/openapi';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/routes';
import { usersRouter } from './modules/users/routes';
import { dogsRouter } from './modules/dogs/routes';
import { walksRouter } from './modules/walks/routes';
import { eventsRouter } from './modules/events/routes';
import { chatRouter } from './modules/chat/routes';
import { matchesRouter } from './modules/matches/routes';
import { placesRouter } from './modules/places/routes';
import { storageRouter } from './modules/storage/routes';
import { adminRouter } from './modules/admin/routes';
import { shelterRequestsRouter } from './modules/shelterRequests/routes';
import { notificationsRouter } from './modules/notifications/routes';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(
    '/uploads',
    express.static(path.resolve(env.uploadDir), {
      setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
    }),
  );

  app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  // swagger-ui-express's types may resolve against another workspace's copy of
  // @types/express (backend/ uses v5), so cast to this app's handler type.
  app.use(
    '/api/docs',
    swaggerUi.serve as unknown as express.RequestHandler[],
    swaggerUi.setup(openapiSpec) as unknown as express.RequestHandler,
  );
  app.get('/api/docs.json', (_req, res) => res.json(openapiSpec));

  const v1 = express.Router();
  v1.use('/auth', authRouter);
  v1.use('/users', usersRouter);
  v1.use('/dogs', dogsRouter);
  v1.use('/walks', walksRouter);
  v1.use('/events', eventsRouter);
  v1.use('/chat', chatRouter);
  // Mounted ahead of matchesRouter: matchesRouter is mounted at the v1 root (no
  // path prefix, since it owns two top-level paths) with a blanket requireAuth,
  // which — for any *unauthenticated* request — matches and short-circuits
  // before reaching a router mounted after it. /admin/auth/login must stay
  // reachable without an app-user token, so it has to come first in the chain.
  v1.use('/admin', adminRouter); // separate admin-only auth (requireAdmin) — never uses the app-user JWT
  v1.use(matchesRouter); // mounts /matches and /discover itself
  v1.use('/dog-requests', shelterRequestsRouter);
  v1.use('/notifications', notificationsRouter);
  v1.use('/places', placesRouter);
  v1.use('/storage', storageRouter);
  app.use('/api/v1', v1);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
