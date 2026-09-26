import request from 'supertest';
import { app, authHeader, devLoginAs, devLoginAsShelter, unique } from '../../../test/helpers';

describe('blocks', () => {
  it('lists a blocked user, then unblocks them and the list empties', async () => {
    const a = await devLoginAs(unique('BlockerA'));
    const b = await devLoginAs(unique('BlockedB'));

    const empty = await request(app).get('/api/v1/blocks').set(authHeader(a.accessToken));
    expect(empty.body).toEqual([]);

    const block = await request(app).put(`/api/v1/blocks/${b.user.id}`).set(authHeader(a.accessToken));
    expect(block.status).toBe(200);

    const listed = await request(app).get('/api/v1/blocks').set(authHeader(a.accessToken));
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0].id).toBe(b.user.id);
    expect(listed.body[0].blockedAt).toBeDefined();

    const unblock = await request(app).delete(`/api/v1/blocks/${b.user.id}`).set(authHeader(a.accessToken));
    expect(unblock.status).toBe(200);
    const after = await request(app).get('/api/v1/blocks').set(authHeader(a.accessToken));
    expect(after.body).toEqual([]);
  });

  it('rejects blocking yourself and blocking a user that does not exist', async () => {
    const a = await devLoginAs(unique('SelfBlocker'));
    const self = await request(app).put(`/api/v1/blocks/${a.user.id}`).set(authHeader(a.accessToken));
    expect(self.status).toBe(400);

    const ghost = await request(app)
      .put('/api/v1/blocks/00000000-0000-0000-0000-000000000000')
      .set(authHeader(a.accessToken));
    expect(ghost.status).toBe(404);
  });

  it('blocking a match counterpart removes the match from both lists and blocks messaging in both directions', async () => {
    const a = await devLoginAs(unique('MatchBlockA'));
    const b = await devLoginAs(unique('MatchBlockB'));
    await request(app).post(`/api/v1/discover/${b.user.id}/swipe-right`).set(authHeader(a.accessToken));
    await request(app).post(`/api/v1/discover/${a.user.id}/swipe-right`).set(authHeader(b.accessToken));

    const aMatches = await request(app).get('/api/v1/matches').set(authHeader(a.accessToken));
    const matchId = aMatches.body.find((m: { userId: string }) => m.userId === b.user.id).id;

    await request(app).put(`/api/v1/blocks/${b.user.id}`).set(authHeader(a.accessToken));

    const aAfter = await request(app).get('/api/v1/matches').set(authHeader(a.accessToken));
    expect(aAfter.body.some((m: { userId: string }) => m.userId === b.user.id)).toBe(false);
    const bAfter = await request(app).get('/api/v1/matches').set(authHeader(b.accessToken));
    expect(bAfter.body.some((m: { userId: string }) => m.userId === a.user.id)).toBe(false);

    const fromBlocker = await request(app)
      .post(`/api/v1/matches/${matchId}/messages`)
      .set(authHeader(a.accessToken))
      .send({ content: 'hi' });
    expect(fromBlocker.status).toBe(403);

    const fromBlocked = await request(app)
      .post(`/api/v1/matches/${matchId}/messages`)
      .set(authHeader(b.accessToken))
      .send({ content: 'hi' });
    expect(fromBlocked.status).toBe(403);
  });

  it('excludes a blocked person from the discover deck in both directions and blocks swiping on them', async () => {
    const a = await devLoginAs(unique('DeckBlockA'));
    const b = await devLoginAs(unique('DeckBlockB'));

    await request(app).put(`/api/v1/blocks/${b.user.id}`).set(authHeader(a.accessToken));

    const aDeck = await request(app).get('/api/v1/discover/deck').set(authHeader(a.accessToken));
    expect(aDeck.body.some((c: { id: string }) => c.id === b.user.id)).toBe(false);
    const bDeck = await request(app).get('/api/v1/discover/deck').set(authHeader(b.accessToken));
    expect(bDeck.body.some((c: { id: string }) => c.id === a.user.id)).toBe(false);

    const swipe = await request(app).post(`/api/v1/discover/${a.user.id}/swipe-right`).set(authHeader(b.accessToken));
    expect(swipe.status).toBe(403);
  });

  it('hides a blocked shelter\'s dogs from the swiper\'s deck', async () => {
    const shelter = await devLoginAsShelter(unique('BlockedShelter'));
    const dog = await request(app)
      .post('/api/v1/dogs')
      .set(authHeader(shelter.accessToken))
      .send({ name: 'Rocky', breed: 'Mixed', age: 2, personality: [] });
    const walker = await devLoginAs(unique('ShelterBlocker'));

    await request(app).put(`/api/v1/blocks/${shelter.user.id}`).set(authHeader(walker.accessToken));

    const deck = await request(app).get('/api/v1/discover/deck').set(authHeader(walker.accessToken));
    expect(deck.body.some((c: { kind: string; id?: string }) => c.kind === 'shelterDog' && c.id === dog.body.id)).toBe(false);
  });

  it('blocking a shelter blocks liking their dogs and messaging an existing accepted request', async () => {
    const shelter = await devLoginAsShelter(unique('LikeBlockShelter'));
    const dog = await request(app)
      .post('/api/v1/dogs')
      .set(authHeader(shelter.accessToken))
      .send({ name: 'Milo', breed: 'Mixed', age: 2, personality: [] });
    const walker = await devLoginAs(unique('LikeBlockWalker'));

    const like = await request(app).post(`/api/v1/dogs/${dog.body.id}/like`).set(authHeader(walker.accessToken));
    await request(app).post(`/api/v1/dog-requests/${like.body.id}/accept`).set(authHeader(shelter.accessToken));

    await request(app).put(`/api/v1/blocks/${shelter.user.id}`).set(authHeader(walker.accessToken));

    const blockedMessage = await request(app)
      .post(`/api/v1/dog-requests/${like.body.id}/messages`)
      .set(authHeader(walker.accessToken))
      .send({ content: 'hi' });
    expect(blockedMessage.status).toBe(403);

    const inbox = await request(app).get('/api/v1/dog-requests').set(authHeader(shelter.accessToken));
    expect(inbox.body.some((r: { id: string }) => r.id === like.body.id)).toBe(false);

    const otherDog = await request(app)
      .post('/api/v1/dogs')
      .set(authHeader(shelter.accessToken))
      .send({ name: 'Fresh', breed: 'Mixed', age: 1, personality: [] });
    const newLike = await request(app).post(`/api/v1/dogs/${otherDog.body.id}/like`).set(authHeader(walker.accessToken));
    expect(newLike.status).toBe(403);
  });

  it('hides a blocked host\'s walks from the walk list', async () => {
    const host = await devLoginAs(unique('WalkBlockHost'));
    const viewer = await devLoginAs(unique('WalkBlockViewer'));
    const walk = await request(app)
      .post('/api/v1/walks')
      .set(authHeader(host.accessToken))
      .send({
        title: 'Blocked host walk',
        meetingLat: 52.23,
        meetingLng: 21.01,
        meetingPoint: 'Park',
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
      });

    const before = await request(app).get('/api/v1/walks').set(authHeader(viewer.accessToken));
    expect(before.body.some((w: { id: string }) => w.id === walk.body.id)).toBe(true);

    await request(app).put(`/api/v1/blocks/${host.user.id}`).set(authHeader(viewer.accessToken));

    const after = await request(app).get('/api/v1/walks').set(authHeader(viewer.accessToken));
    expect(after.body.some((w: { id: string }) => w.id === walk.body.id)).toBe(false);
  });
});
