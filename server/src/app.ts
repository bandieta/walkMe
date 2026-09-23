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

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(path.resolve(env.uploadDir)));

  app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
  app.get('/api/docs.json', (_req, res) => res.json(openapiSpec));

  const v1 = express.Router();
  v1.use('/auth', authRouter);
  v1.use('/users', usersRouter);
  v1.use('/dogs', dogsRouter);
  v1.use('/walks', walksRouter);
  v1.use('/events', eventsRouter);
  v1.use('/chat', chatRouter);
  v1.use(matchesRouter); // mounts /matches and /discover itself
  v1.use('/places', placesRouter);
  v1.use('/storage', storageRouter);
  app.use('/api/v1', v1);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
