import request from 'supertest';
import { app, authHeader, devLoginAs, devLoginAsShelter, unique } from '../../../test/helpers';

async function addShelterDog(shelterToken: string, name: string) {
  const res = await request(app)
    .post('/api/v1/dogs')
    .set(authHeader(shelterToken))
    .send({ name, breed: 'Mixed', age: 3, personality: [] });
  return res.body as { id: string; ownerId?: string; shelterId?: string };
}

describe('shelter accounts and dog walk requests', () => {
  it('rejects a shelter signup without the shelter confirmation checkbox', async () => {
    const res = await request(app)
      .post('/api/v1/auth/dev-login')
      .send({ displayName: unique('UnconfirmedShelter'), accountType: 'shelter' });
    expect(res.status).toBe(400);
  });

  it('creates a shelter account when confirmed, and its dogs have no personal owner', async () => {
    const shelter = await devLoginAsShelter(unique('HappyPaws'));
    expect(shelter.user.accountType).toBe('shelter');

    const dog = await addShelterDog(shelter.accessToken, 'Buddy');
    expect(dog.shelterId).toBe(shelter.user.id);
    expect(dog.ownerId).toBeUndefined();
  });

  it('a person account cannot be created as an unconfirmed shelter, but a normal person signup is unaffected', async () => {
    const person = await devLoginAs(unique('JustAWalker'));
    expect((person.user as { accountType?: string }).accountType ?? 'person').toBe('person');
  });

  it('shows a shelter dog in Discover as its own card, distinct from person cards', async () => {
    const shelter = await devLoginAsShelter(unique('SecondChance'));
    const dog = await addShelterDog(shelter.accessToken, 'Luna');
    const walker = await devLoginAs(unique('DeckWalker'));

    const deck = await request(app).get('/api/v1/discover/deck').set(authHeader(walker.accessToken));
    const card = deck.body.find((c: { kind: string; id?: string }) => c.kind === 'shelterDog' && c.id === dog.id);
    expect(card).toBeTruthy();
    expect(card.dog.name).toBe('Luna');
    expect(card.shelter.id).toBe(shelter.user.id);
  });

  it('liking a shelter dog creates a pending request, and messaging is blocked until the shelter accepts it', async () => {
    const shelter = await devLoginAsShelter(unique('PawsHome'));
    const dog = await addShelterDog(shelter.accessToken, 'Rex');
    const walker = await devLoginAs(unique('RexFan'));

    const like = await request(app).post(`/api/v1/dogs/${dog.id}/like`).set(authHeader(walker.accessToken));
    expect(like.status).toBe(201);
    expect(like.body.status).toBe('pending');
    const requestId = like.body.id;

    const blocked = await request(app)
      .post(`/api/v1/dog-requests/${requestId}/messages`)
      .set(authHeader(walker.accessToken))
      .send({ content: 'Hi!' });
    expect(blocked.status).toBe(400);

    const shelterInbox = await request(app).get('/api/v1/dog-requests').set(authHeader(shelter.accessToken));
    expect(shelterInbox.body).toHaveLength(1);
    expect(shelterInbox.body[0].dog.name).toBe('Rex');
    expect(shelterInbox.body[0].requester.id).toBe(walker.user.id);

    const accept = await request(app).post(`/api/v1/dog-requests/${requestId}/accept`).set(authHeader(shelter.accessToken));
    expect(accept.status).toBe(200);
    expect(accept.body.status).toBe('accepted');

    const sent = await request(app)
      .post(`/api/v1/dog-requests/${requestId}/messages`)
      .set(authHeader(walker.accessToken))
      .send({ content: 'Can I come meet Rex?' });
    expect(sent.status).toBe(201);

    const shelterView = await request(app).get('/api/v1/dog-requests').set(authHeader(shelter.accessToken));
    expect(shelterView.body[0].unread).toBe(1);

    await request(app).post(`/api/v1/dog-requests/${requestId}/read`).set(authHeader(shelter.accessToken));
    const shelterViewAfter = await request(app).get('/api/v1/dog-requests').set(authHeader(shelter.accessToken));
    expect(shelterViewAfter.body[0].unread).toBe(0);

    const reply = await request(app)
      .post(`/api/v1/dog-requests/${requestId}/messages`)
      .set(authHeader(shelter.accessToken))
      .send({ content: 'Of course — this weekend?' });
    expect(reply.status).toBe(201);

    const history = await request(app).get(`/api/v1/dog-requests/${requestId}/messages`).set(authHeader(walker.accessToken));
    expect(history.body.map((m: { content: string }) => m.content)).toEqual(['Can I come meet Rex?', 'Of course — this weekend?']);
  });

  it('the shelter can decline a request instead of accepting it', async () => {
    const shelter = await devLoginAsShelter(unique('NoHome'));
    const dog = await addShelterDog(shelter.accessToken, 'Shadow');
    const walker = await devLoginAs(unique('ShadowFan'));

    const like = await request(app).post(`/api/v1/dogs/${dog.id}/like`).set(authHeader(walker.accessToken));
    const decline = await request(app).post(`/api/v1/dog-requests/${like.body.id}/decline`).set(authHeader(shelter.accessToken));
    expect(decline.body.status).toBe('declined');
  });

  it('an accepted shelter dog becomes walkable, and a walk can be created with it once approved but not before', async () => {
    const shelter = await devLoginAsShelter(unique('WalkableShelter'));
    const dog = await addShelterDog(shelter.accessToken, 'Milo');
    const walker = await devLoginAs(unique('MiloWalker'));

    const beforeLike = await request(app).get('/api/v1/users/me/walkable-dogs').set(authHeader(walker.accessToken));
    expect(beforeLike.body.shelterDogs).toEqual([]);

    const like = await request(app).post(`/api/v1/dogs/${dog.id}/like`).set(authHeader(walker.accessToken));

    const deniedWalk = await request(app)
      .post('/api/v1/walks')
      .set(authHeader(walker.accessToken))
      .send({
        title: 'Walk with Milo',
        meetingLat: 52.23,
        meetingLng: 21.01,
        meetingPoint: 'Park',
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
        dogId: dog.id,
      });
    expect(deniedWalk.status).toBe(403);

    await request(app).post(`/api/v1/dog-requests/${like.body.id}/accept`).set(authHeader(shelter.accessToken));

    const afterAccept = await request(app).get('/api/v1/users/me/walkable-dogs').set(authHeader(walker.accessToken));
    expect(afterAccept.body.shelterDogs.map((d: { id: string }) => d.id)).toContain(dog.id);

    const allowedWalk = await request(app)
      .post('/api/v1/walks')
      .set(authHeader(walker.accessToken))
      .send({
        title: 'Walk with Milo',
        meetingLat: 52.23,
        meetingLng: 21.01,
        meetingPoint: 'Park',
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
        dogId: dog.id,
      });
    expect(allowedWalk.status).toBe(201);
    expect(allowedWalk.body.participantDogs[walker.user.id].id).toBe(dog.id);
  });
});
