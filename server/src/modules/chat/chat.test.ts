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
});
