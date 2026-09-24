import { createServer } from 'http';
import { AddressInfo } from 'net';
import { Server } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import request from 'supertest';
import { app, authHeader, devLoginAs, unique } from '../../../test/helpers';
import { registerChatGateway } from './socket';

describe('chat socket gateway', () => {
  let httpServer: ReturnType<typeof createServer>;
  let port: number;

  beforeAll((done) => {
    httpServer = createServer(app);
    const io = new Server(httpServer);
    registerChatGateway(io);
    httpServer.listen(() => {
      port = (httpServer.address() as AddressInfo).port;
      done();
    });
  });

  afterAll((done) => {
    httpServer.close(() => done());
  });

  it('delivers a real-time message to everyone in the walk room', async () => {
    const host = await devLoginAs(unique('SocketHost'));
    const guest = await devLoginAs(unique('SocketGuest'));

    const walk = await request(app)
      .post('/api/v1/walks')
      .set(authHeader(host.accessToken))
      .send({
        title: 'Live walk',
        meetingLat: 52.23,
        meetingLng: 21.01,
        meetingPoint: 'Park',
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
      });

    const hostSocket: ClientSocket = ioClient(`http://localhost:${port}/chat`, { auth: { token: host.accessToken } });
    const guestSocket: ClientSocket = ioClient(`http://localhost:${port}/chat`, { auth: { token: guest.accessToken } });

    await Promise.all([
      new Promise<void>((resolve) => hostSocket.on('connect', () => resolve())),
      new Promise<void>((resolve) => guestSocket.on('connect', () => resolve())),
    ]);

    hostSocket.emit('chat:room:join', { walkId: walk.body.id });
    guestSocket.emit('chat:room:join', { walkId: walk.body.id });

    const received = new Promise<{ content: string }>((resolve) => {
      guestSocket.on('chat:message:receive', resolve);
    });

    // Give the join a tick to land before sending.
    await new Promise((resolve) => setTimeout(resolve, 50));
    hostSocket.emit('chat:message:send', { walkId: walk.body.id, content: 'Live from the socket!' });

    const message = await received;
    expect(message.content).toBe('Live from the socket!');

    hostSocket.close();
    guestSocket.close();
  });

  it('rejects a connection without a valid token', (done) => {
    const badSocket: ClientSocket = ioClient(`http://localhost:${port}/chat`, { auth: { token: 'garbage' } });
    badSocket.on('connect_error', (err) => {
      expect(err.message).toMatch(/Invalid|expired/i);
      badSocket.close();
      done();
    });
  });
});
