import request from 'supertest';
import { app, authHeader, devLoginAs, unique } from '../../../test/helpers';

const PRIVATE_FIELDS = ['email', 'lat', 'lng'] as const;

function expectNoPrivateFields(user: Record<string, unknown>) {
  for (const field of PRIVATE_FIELDS) expect(user).not.toHaveProperty(field);
}

describe('user privacy', () => {
  it('shows your own email and home coordinates only to you', async () => {
    const owner = await devLoginAs(unique('Owner'), `${unique('owner')}@example.com`);
    const other = await devLoginAs(unique('Viewer'));
    await request(app)
      .patch('/api/v1/users/me')
      .set(authHeader(owner.accessToken))
      .send({ lat: 52.2297, lng: 21.0122, location: 'Mokotów, Warsaw', radiusKm: 5 });
    await request(app).patch('/api/v1/users/me').set(authHeader(other.accessToken)).send({ lat: 52.23, lng: 21.01, radiusKm: 5 });

    const me = await request(app).get('/api/v1/users/me').set(authHeader(owner.accessToken));
    expect(me.body.email).toBeDefined();
    expect(me.body.lat).toBe(52.2297);

    const profile = await request(app).get(`/api/v1/users/${owner.user.id}`).set(authHeader(other.accessToken));
    expect(profile.status).toBe(200);
    expect(profile.body.location).toBe('Mokotów, Warsaw');
    expectNoPrivateFields(profile.body);

    const deck = await request(app).get('/api/v1/discover/deck').set(authHeader(other.accessToken));
    const card = deck.body.find((c: { id: string }) => c.id === owner.user.id);
    expect(card).toBeDefined();
    expect(card.distanceKm).toBeDefined();
    expectNoPrivateFields(card);

    const walk = await request(app)
      .post('/api/v1/walks')
      .set(authHeader(owner.accessToken))
      .send({
        title: 'Privacy walk',
        meetingLat: 52.23,
        meetingLng: 21.01,
        meetingPoint: 'Park',
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
      });
    const seen = await request(app).get(`/api/v1/walks/${walk.body.id}`).set(authHeader(other.accessToken));
    expectNoPrivateFields(seen.body.host);
    for (const p of seen.body.participants) expectNoPrivateFields(p);
  });
});
