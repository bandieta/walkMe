import request from 'supertest';
import { app, authHeader, devLoginAs, unique } from '../../../test/helpers';

describe('dogs', () => {
  it('creates, lists, updates and deletes a dog', async () => {
    const { accessToken } = await devLoginAs(unique('DogOwner'));

    const create = await request(app)
      .post('/api/v1/dogs')
      .set(authHeader(accessToken))
      .send({ name: 'Luna', breed: 'Golden Retriever', age: 3, personality: ['Friendly'] });
    expect(create.status).toBe(201);
    expect(create.body.name).toBe('Luna');
    expect(create.body.personality).toEqual(['Friendly']);

    const mine = await request(app).get('/api/v1/users/me/dogs').set(authHeader(accessToken));
    expect(mine.status).toBe(200);
    expect(mine.body).toHaveLength(1);

    const updated = await request(app)
      .patch(`/api/v1/dogs/${create.body.id}`)
      .set(authHeader(accessToken))
      .send({ age: 4 });
    expect(updated.status).toBe(200);
    expect(updated.body.age).toBe(4);

    const deleted = await request(app).delete(`/api/v1/dogs/${create.body.id}`).set(authHeader(accessToken));
    expect(deleted.status).toBe(200);

    const mineAfter = await request(app).get('/api/v1/users/me/dogs').set(authHeader(accessToken));
    expect(mineAfter.body).toHaveLength(0);
  });

  it('forbids editing someone else\'s dog', async () => {
    const owner = await devLoginAs(unique('Owner'));
    const intruder = await devLoginAs(unique('Intruder'));

    const dog = await request(app)
      .post('/api/v1/dogs')
      .set(authHeader(owner.accessToken))
      .send({ name: 'Rex', breed: 'Husky', age: 2 });

    const res = await request(app)
      .patch(`/api/v1/dogs/${dog.body.id}`)
      .set(authHeader(intruder.accessToken))
      .send({ age: 10 });
    expect(res.status).toBe(403);
  });
});
