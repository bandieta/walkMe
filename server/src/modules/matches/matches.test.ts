import request from 'supertest';
import { app, authHeader, devLoginAs, devLoginAsShelter, unique } from '../../../test/helpers';
import { prisma } from '../../lib/prisma';

describe('matches & discover', () => {
  it('does not match on a one-sided swipe, but matches on mutual right swipes', async () => {
    const a = await devLoginAs(unique('SwipeA'));
    const b = await devLoginAs(unique('SwipeB'));

    const oneSided = await request(app)
      .post(`/api/v1/discover/${b.user.id}/swipe-right`)
      .set(authHeader(a.accessToken));
    expect(oneSided.body.matched).toBe(false);

    const mutual = await request(app)
      .post(`/api/v1/discover/${a.user.id}/swipe-right`)
      .set(authHeader(b.accessToken));
    expect(mutual.body.matched).toBe(true);
    expect(mutual.body.user.id).toBe(a.user.id);

    const aMatches = await request(app).get('/api/v1/matches').set(authHeader(a.accessToken));
    expect(aMatches.body.some((m: { userId: string }) => m.userId === b.user.id)).toBe(true);
  });

  it('sends match messages, tracks unread for the recipient, and clears it on read', async () => {
    const a = await devLoginAs(unique('ChatA'));
    const b = await devLoginAs(unique('ChatB'));
    await request(app).post(`/api/v1/discover/${b.user.id}/swipe-right`).set(authHeader(a.accessToken));
    await request(app).post(`/api/v1/discover/${a.user.id}/swipe-right`).set(authHeader(b.accessToken));

    const aMatches = await request(app).get('/api/v1/matches').set(authHeader(a.accessToken));
    const matchId = aMatches.body.find((m: { userId: string }) => m.userId === b.user.id).id;

    await request(app)
      .post(`/api/v1/matches/${matchId}/messages`)
      .set(authHeader(a.accessToken))
      .send({ content: 'Hey!' });

    const bMatches = await request(app).get('/api/v1/matches').set(authHeader(b.accessToken));
    const bView = bMatches.body.find((m: { userId: string }) => m.userId === a.user.id);
    expect(bView.unread).toBe(1);
    expect(bView.lastMessage).toBe('Hey!');

    await request(app).post(`/api/v1/matches/${matchId}/read`).set(authHeader(b.accessToken));
    const bMatchesAfter = await request(app).get('/api/v1/matches').set(authHeader(b.accessToken));
    expect(bMatchesAfter.body.find((m: { userId: string }) => m.userId === a.user.id).unread).toBe(0);
  });

  it('sends an image message and shows a friendly preview instead of the raw URL', async () => {
    const a = await devLoginAs(unique('PhotoA'));
    const b = await devLoginAs(unique('PhotoB'));
    await request(app).post(`/api/v1/discover/${b.user.id}/swipe-right`).set(authHeader(a.accessToken));
    await request(app).post(`/api/v1/discover/${a.user.id}/swipe-right`).set(authHeader(b.accessToken));
    const aMatches = await request(app).get('/api/v1/matches').set(authHeader(a.accessToken));
    const matchId = aMatches.body.find((m: { userId: string }) => m.userId === b.user.id).id;

    const sent = await request(app)
      .post(`/api/v1/matches/${matchId}/messages`)
      .set(authHeader(a.accessToken))
      .send({ content: 'https://cdn.example.com/uploads/dog.jpg', type: 'image' });
    expect(sent.status).toBe(201);
    expect(sent.body.type).toBe('image');
    expect(sent.body.content).toBe('https://cdn.example.com/uploads/dog.jpg');

    const bMatches = await request(app).get('/api/v1/matches').set(authHeader(b.accessToken));
    expect(bMatches.body.find((m: { userId: string }) => m.userId === a.user.id).lastMessage).toBe('📷 Photo');
  });

  it('excludes already-swiped users from the discover deck', async () => {
    const viewer = await devLoginAs(unique('Viewer'));
    const target = await devLoginAs(unique('Target'));

    const before = await request(app).get('/api/v1/discover/deck').set(authHeader(viewer.accessToken));
    expect(before.body.some((c: { id: string }) => c.id === target.user.id)).toBe(true);

    await request(app).post(`/api/v1/discover/${target.user.id}/swipe-left`).set(authHeader(viewer.accessToken));

    const after = await request(app).get('/api/v1/discover/deck').set(authHeader(viewer.accessToken));
    expect(after.body.some((c: { id: string }) => c.id === target.user.id)).toBe(false);
  });

  it('adds distanceKm to deck candidates when both people have a home area', async () => {
    const viewer = await devLoginAs(unique('GeoViewer'));
    const near = await devLoginAs(unique('GeoNear'));
    // 0.01 degrees of latitude is ~1.1 km.
    await prisma.user.update({ where: { id: viewer.user.id }, data: { lat: 52.2, lng: 21.0 } });
    await prisma.user.update({ where: { id: near.user.id }, data: { lat: 52.21, lng: 21.0 } });

    const deck = await request(app).get('/api/v1/discover/deck').set(authHeader(viewer.accessToken));
    const card = deck.body.find((c: { id: string }) => c.id === near.user.id);
    expect(card.distanceKm).toBeCloseTo(1.1, 1);
    const other = deck.body.find((c: { id: string; distanceKm?: number }) => c.id !== near.user.id && c.distanceKm === undefined);
    expect(other).toBeDefined();
  });

  it('brings swiped users back into the deck after a reset', async () => {
    const viewer = await devLoginAs(unique('ResetViewer'));
    const target = await devLoginAs(unique('ResetTarget'));
    await request(app).post(`/api/v1/discover/${target.user.id}/swipe-left`).set(authHeader(viewer.accessToken));
    const gone = await request(app).get('/api/v1/discover/deck').set(authHeader(viewer.accessToken));
    expect(gone.body.some((c: { id: string }) => c.id === target.user.id)).toBe(false);

    const reset = await request(app).post('/api/v1/discover/reset').set(authHeader(viewer.accessToken));
    expect(reset.status).toBe(200);
    const back = await request(app).get('/api/v1/discover/deck').set(authHeader(viewer.accessToken));
    expect(back.body.some((c: { id: string }) => c.id === target.user.id)).toBe(true);
  });
  it('swiping right again on an existing match does not send another match notification', async () => {
    const a = await devLoginAs(unique('AgainA'));
    const b = await devLoginAs(unique('AgainB'));
    await request(app).post(`/api/v1/discover/${b.user.id}/swipe-right`).set(authHeader(a.accessToken));
    await request(app).post(`/api/v1/discover/${a.user.id}/swipe-right`).set(authHeader(b.accessToken));
    const again = await request(app).post(`/api/v1/discover/${a.user.id}/swipe-right`).set(authHeader(b.accessToken));
    expect(again.status).toBe(200);

    for (const s of [a, b]) {
      const inbox = await request(app).get('/api/v1/notifications').set(authHeader(s.accessToken));
      expect((inbox.body.items as { type: string }[]).filter((n) => n.type === 'match')).toHaveLength(1);
    }
  });

  it('unmatch ends the match and deletes the message history for both sides', async () => {
    const a = await devLoginAs(unique('UnmatchA'));
    const b = await devLoginAs(unique('UnmatchB'));
    await request(app).post(`/api/v1/discover/${b.user.id}/swipe-right`).set(authHeader(a.accessToken));
    await request(app).post(`/api/v1/discover/${a.user.id}/swipe-right`).set(authHeader(b.accessToken));
    const aMatches = await request(app).get('/api/v1/matches').set(authHeader(a.accessToken));
    const matchId = aMatches.body.find((m: { userId: string }) => m.userId === b.user.id).id;
    await request(app).post(`/api/v1/matches/${matchId}/messages`).set(authHeader(a.accessToken)).send({ content: 'hey' });

    const other = await devLoginAs(unique('UnmatchOther'));
    const forbidden = await request(app).delete(`/api/v1/matches/${matchId}`).set(authHeader(other.accessToken));
    expect(forbidden.status).toBe(403);

    const unmatch = await request(app).delete(`/api/v1/matches/${matchId}`).set(authHeader(a.accessToken));
    expect(unmatch.status).toBe(200);
    expect(unmatch.body.success).toBe(true);

    const aAfter = await request(app).get('/api/v1/matches').set(authHeader(a.accessToken));
    expect(aAfter.body.some((m: { userId: string }) => m.userId === b.user.id)).toBe(false);
    const bAfter = await request(app).get('/api/v1/matches').set(authHeader(b.accessToken));
    expect(bAfter.body.some((m: { userId: string }) => m.userId === a.user.id)).toBe(false);

    const messagesGone = await request(app).get(`/api/v1/matches/${matchId}/messages`).set(authHeader(a.accessToken));
    expect(messagesGone.status).toBe(404);
  });

  it('returns 404 when swiping on a user that does not exist', async () => {
    const a = await devLoginAs(unique('Ghost'));
    const res = await request(app).post('/api/v1/discover/00000000-0000-0000-0000-000000000000/swipe-right').set(authHeader(a.accessToken));
    expect(res.status).toBe(404);
  });
  it('filters the deck by dog energy, age group and shelter-only', async () => {
    const viewer = await devLoginAs(unique('FilterViewer'));
    const calmOwner = await devLoginAs(unique('CalmOwner'));
    await request(app).post('/api/v1/dogs').set(authHeader(calmOwner.accessToken)).send({
      name: 'Sleepy', breed: 'Basset', age: 8, energy: 'Calm', ageGroup: 'Senior', personality: [],
    });
    const highOwner = await devLoginAs(unique('HighOwner'));
    await request(app).post('/api/v1/dogs').set(authHeader(highOwner.accessToken)).send({
      name: 'Zoomies', breed: 'Border Collie', age: 1, energy: 'High', ageGroup: 'Puppy', personality: [],
    });
    const shelter = await devLoginAsShelter(unique('FilterShelter'));
    const shelterDog = await request(app).post('/api/v1/dogs').set(authHeader(shelter.accessToken)).send({
      name: 'Shelter Calm', breed: 'Mixed', age: 6, energy: 'Calm', ageGroup: 'Senior', personality: [],
    });

    const calmOnly = await request(app).get('/api/v1/discover/deck').query({ energy: 'Calm' }).set(authHeader(viewer.accessToken));
    const calmIds = calmOnly.body.map((c: { id: string }) => c.id);
    expect(calmIds).toContain(calmOwner.user.id);
    expect(calmIds).not.toContain(highOwner.user.id);
    expect(calmIds).toContain(shelterDog.body.id);

    const puppyOnly = await request(app).get('/api/v1/discover/deck').query({ ageGroup: 'Puppy' }).set(authHeader(viewer.accessToken));
    const puppyIds = puppyOnly.body.map((c: { id: string }) => c.id);
    expect(puppyIds).toContain(highOwner.user.id);
    expect(puppyIds).not.toContain(calmOwner.user.id);

    const shelterOnly = await request(app).get('/api/v1/discover/deck').query({ shelterOnly: 'true' }).set(authHeader(viewer.accessToken));
    expect(shelterOnly.body.every((c: { kind: string }) => c.kind === 'shelterDog')).toBe(true);
    expect(shelterOnly.body.some((c: { id: string }) => c.id === shelterDog.body.id)).toBe(true);
  });

  it('keeps showing newly joined and nearby people once there are more than a deck of candidates', async () => {
    for (let i = 0; i < 55; i += 1) await devLoginAs(unique('Crowd'));
    const viewer = await devLoginAs(unique('CrowdViewer'));
    await request(app).patch('/api/v1/users/me').set(authHeader(viewer.accessToken)).send({ lat: 50.06, lng: 19.94, radiusKm: 5 });
    const neighbour = await devLoginAs(unique('CrowdNeighbour'));
    await request(app).patch('/api/v1/users/me').set(authHeader(neighbour.accessToken)).send({ lat: 50.061, lng: 19.941 });
    for (let i = 0; i < 5; i += 1) await devLoginAs(unique('CrowdLate'));
    const newcomer = await devLoginAs(unique('CrowdNewcomer'));

    const deck = await request(app).get('/api/v1/discover/deck').set(authHeader(viewer.accessToken));
    const ids = (deck.body as { id: string; kind: string }[]).filter((c) => c.kind === 'person').map((c) => c.id);
    expect(ids[0]).toBe(neighbour.user.id);
    expect(ids).toContain(newcomer.user.id);
  });
});
