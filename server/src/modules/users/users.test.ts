import request from 'supertest';
import { app, authHeader, devLoginAs, unique } from '../../../test/helpers';

describe('users', () => {
  it('exposes another user\'s public profile, including how they signed in', async () => {
    const viewer = await devLoginAs(unique('ProfileViewer'));
    const target = await devLoginAs(unique('ProfileTarget'));

    const res = await request(app).get(`/api/v1/users/${target.user.id}`).set(authHeader(viewer.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(target.user.id);
    expect(res.body.displayName).toBe(target.user.displayName);
    // dev-login is the only provider reachable in tests, but the field itself should always be there.
    expect(res.body.provider).toBe('dev');
  });

  it('reports walks, walk friends and km for someone else the same way /me/stats does for yourself', async () => {
    const host = await devLoginAs(unique('StatsHost'));
    const guest = await devLoginAs(unique('StatsGuest'));
    const viewer = await devLoginAs(unique('StatsViewer'));

    const create = await request(app)
      .post('/api/v1/walks')
      .set(authHeader(host.accessToken))
      .send({
        title: 'Stats walk',
        meetingLat: 52.23,
        meetingLng: 21.01,
        meetingPoint: 'Park',
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
      });
    await request(app).post(`/api/v1/walks/${create.body.id}/join`).set(authHeader(guest.accessToken));
    await request(app)
      .patch(`/api/v1/walks/${create.body.id}/status`)
      .set(authHeader(host.accessToken))
      .send({ status: 'ended' });

    // A third party (e.g. a shelter deciding whether to trust this walker) reads the host's own numbers.
    const stats = await request(app).get(`/api/v1/users/${host.user.id}/stats`).set(authHeader(viewer.accessToken));
    expect(stats.status).toBe(200);
    expect(stats.body).toEqual({ walks: 1, friends: 0, km: 4 });

    // And the host reading it themselves via /me/stats gets the identical numbers.
    const own = await request(app).get('/api/v1/users/me/stats').set(authHeader(host.accessToken));
    expect(own.body).toEqual(stats.body);
  });
});
