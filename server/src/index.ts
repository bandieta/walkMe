import { createServer } from 'http';
import { Server } from 'socket.io';
import { createApp } from './app';
import { env } from './config/env';
import { registerChatGateway } from './modules/chat/socket';

const app = createApp();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.set('io', io);
registerChatGateway(io);

httpServer.listen(env.port, () => {
  console.log(`walkMe server listening on http://localhost:${env.port}`);
  console.log(`API docs at http://localhost:${env.port}/api/docs`);
});
