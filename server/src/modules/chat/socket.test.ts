import { createServer } from 'http';
import { AddressInfo } from 'net';
import { Server } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import request from 'supertest';
import { app, authHeader, devLoginAs, devLoginAsShelter, unique } from '../../../test/helpers';
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
    await request(app).post(`/api/v1/walks/${walk.body.id}/join`).set(authHeader(guest.accessToken)).send({});

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
    await request(app).post(`/api/v1/walks/${walk.body.id}/join`).set(authHeader(guest.accessToken)).send({});

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

  it('delivers the first dog-request message live, even to a socket that connected before the request was accepted', async () => {
    // Regression test for a bug where the shelter's first message from a walker never showed up live (no toast,
    // no message in the open thread) unless the shelter had already opened that exact chat once. Root cause:
    // roomIdsForUser() only computes a user's rooms once, at socket-connect time, and the dog-request's room
    // doesn't exist (as far as the shelter's room list is concerned) until the requester's own connect or an
    // explicit `chat:room:join` — neither of which happens for the shelter just because they tapped Accept.
    // shelterRequests/routes.ts's `/accept` handler now socketsJoin's both parties' already-connected sockets
    // into the room at the moment it becomes usable, which is what this test asserts.
    const shelter = await devLoginAsShelter(unique('LiveNotifyShelter'));
    const walker = await devLoginAs(unique('LiveNotifyWalker'));

    const dog = await request(app)
      .post('/api/v1/dogs')
      .set(authHeader(shelter.accessToken))
      .send({ name: 'Pixel', breed: 'Mixed', age: 2, personality: [] });

    // Both sockets connect *before* the request is even created, let alone accepted — the scenario where the
    // pre-fix room list would already be stale by the time the request exists.
    const shelterSocket: ClientSocket = ioClient(`http://localhost:${port}/chat`, { auth: { token: shelter.accessToken } });
    const walkerSocket: ClientSocket = ioClient(`http://localhost:${port}/chat`, { auth: { token: walker.accessToken } });
    await Promise.all([
      new Promise<void>((resolve) => shelterSocket.on('connect', () => resolve())),
      new Promise<void>((resolve) => walkerSocket.on('connect', () => resolve())),
    ]);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const like = await request(app).post(`/api/v1/dogs/${dog.body.id}/like`).set(authHeader(walker.accessToken));
    const requestId = like.body.id;

    await request(app).post(`/api/v1/dog-requests/${requestId}/accept`).set(authHeader(shelter.accessToken));
    await new Promise((resolve) => setTimeout(resolve, 50)); // let the accept-time socketsJoin land

    // Neither side ever emits chat:room:join or opens the thread — accepting alone must be enough.
    const received = new Promise<{ content: string }>((resolve) => {
      shelterSocket.on('chat:message:receive', resolve);
    });

    await request(app)
      .post(`/api/v1/dog-requests/${requestId}/messages`)
      .set(authHeader(walker.accessToken))
      .send({ content: 'Hi, is Pixel still available?' });

    const message = await received;
    expect(message.content).toBe('Hi, is Pixel still available?');

    shelterSocket.close();
    walkerSocket.close();
  });

  it('does not let an outsider eavesdrop by joining a walk room or another user’s personal room', async () => {
    const host = await devLoginAs(unique('EavesHost'));
    const spy = await devLoginAs(unique('EavesSpy'));
    const walk = await request(app)
      .post('/api/v1/walks')
      .set(authHeader(host.accessToken))
      .send({
        title: 'Private walk',
        meetingLat: 52.23,
        meetingLng: 21.01,
        meetingPoint: 'Park',
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
      });

    const spySocket: ClientSocket = ioClient(`http://localhost:${port}/chat`, { auth: { token: spy.accessToken } });
    await new Promise<void>((resolve) => spySocket.on('connect', () => resolve()));
    spySocket.emit('chat:room:join', { walkId: walk.body.id });
    spySocket.emit('chat:room:join', { walkId: host.user.id });
    await new Promise((resolve) => setTimeout(resolve, 100));

    const leaked: unknown[] = [];
    spySocket.on('chat:message:receive', (m) => leaked.push(m));
    spySocket.on('notification:new', (n) => leaked.push(n));

    await request(app)
      .post(`/api/v1/chat/${walk.body.id}/messages`)
      .set(authHeader(host.accessToken))
      .send({ content: 'Only for members' });
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(leaked).toHaveLength(0);
    spySocket.close();
  });

  it('ignores socket sends from non-members and survives malformed payloads', async () => {
    const host = await devLoginAs(unique('SendHost'));
    const outsider = await devLoginAs(unique('SendOutsider'));
    const walk = await request(app)
      .post('/api/v1/walks')
      .set(authHeader(host.accessToken))
      .send({
        title: 'Guarded walk',
        meetingLat: 52.23,
        meetingLng: 21.01,
        meetingPoint: 'Park',
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
      });

    const outsiderSocket: ClientSocket = ioClient(`http://localhost:${port}/chat`, { auth: { token: outsider.accessToken } });
    await new Promise<void>((resolve) => outsiderSocket.on('connect', () => resolve()));
    outsiderSocket.emit('chat:message:send', {});
    outsiderSocket.emit('chat:message:send', { walkId: walk.body.id, content: 'sneaky' });
    await new Promise((resolve) => setTimeout(resolve, 150));

    const history = await request(app).get(`/api/v1/chat/${walk.body.id}/messages`).set(authHeader(host.accessToken));
    expect(history.status).toBe(200);
    expect(history.body).toHaveLength(0);
    outsiderSocket.close();
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
