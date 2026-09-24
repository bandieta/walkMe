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
    app.set('io', io);
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

  it('delivers a match direct message to the other person without them joining the room first', async () => {
    const a = await devLoginAs(unique('DmA'));
    const b = await devLoginAs(unique('DmB'));
    await request(app).post(`/api/v1/discover/${b.user.id}/swipe-right`).set(authHeader(a.accessToken));
    const mutual = await request(app)
      .post(`/api/v1/discover/${a.user.id}/swipe-right`)
      .set(authHeader(b.accessToken));
    const matchId = mutual.body.match.id;

    // b never emits chat:room:join — the gateway must auto-join every socket to its user's match/walk rooms on connect.
    const bSocket: ClientSocket = ioClient(`http://localhost:${port}/chat`, { auth: { token: b.accessToken } });
    await new Promise<void>((resolve) => bSocket.on('connect', () => resolve()));
    await new Promise((resolve) => setTimeout(resolve, 50)); // let the async auto-join land

    const received = new Promise<{ content: string }>((resolve) => {
      bSocket.on('chat:message:receive', resolve);
    });

    await request(app)
      .post(`/api/v1/matches/${matchId}/messages`)
      .set(authHeader(a.accessToken))
      .send({ content: 'Hi from A' });

    const message = await received;
    expect(message.content).toBe('Hi from A');

    bSocket.close();
  });

  it('relays a typing indicator to the other person in the room', async () => {
    const host = await devLoginAs(unique('TypingHost'));
    const guest = await devLoginAs(unique('TypingGuest'));

    const walk = await request(app)
      .post('/api/v1/walks')
      .set(authHeader(host.accessToken))
      .send({
        title: 'Typing test walk',
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
    await new Promise((resolve) => setTimeout(resolve, 50));

    const startUpdate = new Promise<{ roomId: string; userId: string; isTyping: boolean }>((resolve) => {
      hostSocket.on('chat:typing:update', resolve);
    });
    guestSocket.emit('chat:typing:start', { roomId: walk.body.id });
    const started = await startUpdate;
    expect(started).toEqual({ roomId: walk.body.id, userId: guest.user.id, isTyping: true });

    const stopUpdate = new Promise<{ roomId: string; userId: string; isTyping: boolean }>((resolve) => {
      hostSocket.on('chat:typing:update', resolve);
    });
    guestSocket.emit('chat:typing:stop', { roomId: walk.body.id });
    const stopped = await stopUpdate;
    expect(stopped).toEqual({ roomId: walk.body.id, userId: guest.user.id, isTyping: false });

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
