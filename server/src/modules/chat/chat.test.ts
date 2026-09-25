import request from 'supertest';
import { app, authHeader, devLoginAs, unique } from '../../../test/helpers';

describe('chat', () => {
  it('lists a walk as a chat room once joined and stores REST message history', async () => {
    const host = await devLoginAs(unique('ChatHost'));

    const walk = await request(app)
      .post('/api/v1/walks')
      .set(authHeader(host.accessToken))
      .send({
        title: 'Chatty walk',
        meetingLat: 52.23,
        meetingLng: 21.01,
        meetingPoint: 'Park',
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
      });

    const rooms = await request(app).get('/api/v1/chat/rooms').set(authHeader(host.accessToken));
    expect(rooms.status).toBe(200);
    expect(rooms.body.some((r: { walkId: string }) => r.walkId === walk.body.id)).toBe(true);

    const send = await request(app)
      .post(`/api/v1/chat/${walk.body.id}/messages`)
      .set(authHeader(host.accessToken))
      .send({ content: 'See you all there!' });
    expect(send.status).toBe(201);
    expect(send.body.senderName).toBe(host.user.displayName);

    const history = await request(app)
      .get(`/api/v1/chat/${walk.body.id}/messages`)
      .set(authHeader(host.accessToken));
    expect(history.body).toHaveLength(1);
    expect(history.body[0].content).toBe('See you all there!');
  });

  it('refuses to read or post in a walk room the user has not joined', async () => {
    const host = await devLoginAs(unique('PrivHost'));
    const outsider = await devLoginAs(unique('PrivOutsider'));
    const walk = await request(app)
      .post('/api/v1/walks')
      .set(authHeader(host.accessToken))
      .send({
        title: 'Members only',
        meetingLat: 52.23,
        meetingLng: 21.01,
        meetingPoint: 'Park',
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
      });

    const read = await request(app).get(`/api/v1/chat/${walk.body.id}/messages`).set(authHeader(outsider.accessToken));
    expect(read.status).toBe(403);
    const post = await request(app)
      .post(`/api/v1/chat/${walk.body.id}/messages`)
      .set(authHeader(outsider.accessToken))
      .send({ content: 'let me in' });
    expect(post.status).toBe(403);
  });

  it('does not expose direct messages through the generic chat endpoint', async () => {
    const a = await devLoginAs(unique('LeakA'));
    const b = await devLoginAs(unique('LeakB'));
    const snoop = await devLoginAs(unique('LeakSnoop'));
    await request(app).post(`/api/v1/discover/${b.user.id}/swipe-right`).set(authHeader(a.accessToken));
    const mutual = await request(app).post(`/api/v1/discover/${a.user.id}/swipe-right`).set(authHeader(b.accessToken));
    const matchId = mutual.body.match.id;
    await request(app).post(`/api/v1/matches/${matchId}/messages`).set(authHeader(a.accessToken)).send({ content: 'secret' });

    const read = await request(app).get(`/api/v1/chat/${matchId}/messages`).set(authHeader(snoop.accessToken));
    expect(read.status).toBe(403);
    const inject = await request(app)
      .post(`/api/v1/chat/${matchId}/messages`)
      .set(authHeader(snoop.accessToken))
      .send({ content: 'injected' });
    expect(inject.status).toBe(403);
  });

  it('does not let clients post system messages', async () => {
    const host = await devLoginAs(unique('SysHost'));
    const walk = await request(app)
      .post('/api/v1/walks')
      .set(authHeader(host.accessToken))
      .send({
        title: 'No forged system lines',
        meetingLat: 52.23,
        meetingLng: 21.01,
        meetingPoint: 'Park',
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
      });
    const res = await request(app)
      .post(`/api/v1/chat/${walk.body.id}/messages`)
      .set(authHeader(host.accessToken))
      .send({ content: 'Walk cancelled by admin', type: 'system' });
    expect(res.status).toBe(400);
  });
});
