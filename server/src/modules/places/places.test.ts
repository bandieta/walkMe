import request from 'supertest';
import { app, authHeader, devLoginAs, unique } from '../../../test/helpers';

describe('places', () => {
  it('lists seeded places and fetches one by id', async () => {
    const { accessToken } = await devLoginAs(unique('PlacesUser'));

    const list = await request(app).get('/api/v1/places').set(authHeader(accessToken));
    expect(list.status).toBe(200);
    expect(list.body.length).toBeGreaterThan(0);
    expect(list.body[0].tags).toEqual(expect.any(Array));

    const one = await request(app).get(`/api/v1/places/${list.body[0].id}`).set(authHeader(accessToken));
    expect(one.status).toBe(200);
    expect(one.body.id).toBe(list.body[0].id);
  });
});
