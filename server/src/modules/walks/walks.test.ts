import request from 'supertest';
import { app, authHeader, devLoginAs, unique } from '../../../test/helpers';

describe('walks', () => {
  it('creates a walk (host auto-joined), lists it, and supports join/leave', async () => {
    const host = await devLoginAs(unique('Host'));
    const guest = await devLoginAs(unique('Guest'));

    const create = await request(app)
      .post('/api/v1/walks')
      .set(authHeader(host.accessToken))
      .send({
        title: 'Evening walk',
        meetingLat: 52.23,
        meetingLng: 21.01,
        meetingPoint: 'City centre',
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
        maxParticipants: 2,
      });
    expect(create.status).toBe(201);
    expect(create.body.participantIds).toEqual([host.user.id]);

    const list = await request(app).get('/api/v1/walks').set(authHeader(guest.accessToken));
    expect(list.status).toBe(200);
    expect(list.body.some((w: { id: string }) => w.id === create.body.id)).toBe(true);

    const join = await request(app)
      .post(`/api/v1/walks/${create.body.id}/join`)
      .set(authHeader(guest.accessToken));
    expect(join.status).toBe(200);
    expect(join.body.participantIds).toContain(guest.user.id);

    const leave = await request(app)
      .post(`/api/v1/walks/${create.body.id}/leave`)
      .set(authHeader(guest.accessToken));
    expect(leave.body.participantIds).not.toContain(guest.user.id);
  });

  it('rejects joining a full walk', async () => {
    const host = await devLoginAs(unique('FullHost'));
    const a = await devLoginAs(unique('A'));

    const create = await request(app)
      .post('/api/v1/walks')
      .set(authHeader(host.accessToken))
      .send({
        title: 'Tiny walk',
        meetingLat: 52.23,
        meetingLng: 21.01,
        meetingPoint: 'Park',
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
        maxParticipants: 1,
      });

    const join = await request(app).post(`/api/v1/walks/${create.body.id}/join`).set(authHeader(a.accessToken));
    expect(join.status).toBe(409);
  });

  it('only lets the host change walk status', async () => {
    const host = await devLoginAs(unique('StatusHost'));
    const stranger = await devLoginAs(unique('Stranger'));

    const create = await request(app)
      .post('/api/v1/walks')
      .set(authHeader(host.accessToken))
      .send({
        title: 'Status walk',
        meetingLat: 52.23,
        meetingLng: 21.01,
        meetingPoint: 'Park',
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
      });

    const forbidden = await request(app)
      .patch(`/api/v1/walks/${create.body.id}/status`)
      .set(authHeader(stranger.accessToken))
      .send({ status: 'live' });
    expect(forbidden.status).toBe(403);

    const allowed = await request(app)
      .patch(`/api/v1/walks/${create.body.id}/status`)
      .set(authHeader(host.accessToken))
      .send({ status: 'live' });
    expect(allowed.status).toBe(200);
    expect(allowed.body.status).toBe('live');
  });
});
