import request from 'supertest';
import { app, authHeader, devLoginAs, devLoginAsShelter, unique } from '../../../test/helpers';
import { prisma } from '../../lib/prisma';

describe('account deletion', () => {
  it('deletes the account and it can no longer be fetched or authenticated', async () => {
    const user = await devLoginAs(unique('DeleteMe'));

    const res = await request(app).delete('/api/v1/users/me').set(authHeader(user.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const gone = await prisma.user.findUnique({ where: { id: user.user.id } });
    expect(gone).toBeNull();

    const me = await request(app).get('/api/v1/users/me').set(authHeader(user.accessToken));
    expect(me.status).toBe(401);
  });

  it('cascade-deletes a solo-host walk and its messages when no one else had joined to hand it to', async () => {
    const host = await devLoginAs(unique('SoloHost'));
    const walk = await request(app)
      .post('/api/v1/walks')
      .set(authHeader(host.accessToken))
      .send({
        title: 'Solo host walk',
        meetingLat: 52.23,
        meetingLng: 21.01,
        meetingPoint: 'Park',
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
      });
    await request(app)
      .post(`/api/v1/chat/${walk.body.id}/messages`)
      .set(authHeader(host.accessToken))
      .send({ content: 'See you all there!' });

    await request(app).delete('/api/v1/users/me').set(authHeader(host.accessToken));

    const walkGone = await prisma.walk.findUnique({ where: { id: walk.body.id } });
    expect(walkGone).toBeNull();
    const messages = await prisma.message.findMany({ where: { roomId: walk.body.id } });
    expect(messages).toHaveLength(0);
  });

  it('reassigns a surviving group walk\'s messages to the "Deleted user" sentinel and transfers the host instead of destroying it', async () => {
    const host = await devLoginAs(unique('TransferHost'));
    const guest = await devLoginAs(unique('TransferGuest'));
    const walk = await request(app)
      .post('/api/v1/walks')
      .set(authHeader(host.accessToken))
      .send({
        title: 'Group walk',
        meetingLat: 52.23,
        meetingLng: 21.01,
        meetingPoint: 'Park',
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
      });
    await request(app).post(`/api/v1/walks/${walk.body.id}/join`).set(authHeader(guest.accessToken));
    await request(app)
      .post(`/api/v1/chat/${walk.body.id}/messages`)
      .set(authHeader(host.accessToken))
      .send({ content: 'See you all there!' });

    await request(app).delete('/api/v1/users/me').set(authHeader(host.accessToken));

    const messages = await prisma.message.findMany({ where: { roomId: walk.body.id } });
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('See you all there!');
    const sender = await prisma.user.findUnique({ where: { id: messages[0].senderId } });
    expect(sender?.displayName).toBe('Deleted user');
    expect(sender?.provider).toBe('system');

    const survived = await request(app).get(`/api/v1/walks/${walk.body.id}`).set(authHeader(guest.accessToken));
    expect(survived.status).toBe(200);
    expect(survived.body.hostId).toBe(guest.user.id);
  });

  it('removes the match and its message history, and cleans up swipes, when either side is deleted', async () => {
    const a = await devLoginAs(unique('SwipeDeleteA'));
    const b = await devLoginAs(unique('SwipeDeleteB'));
    await request(app).post(`/api/v1/discover/${b.user.id}/swipe-right`).set(authHeader(a.accessToken));
    await request(app).post(`/api/v1/discover/${a.user.id}/swipe-right`).set(authHeader(b.accessToken));

    const aMatches = await request(app).get('/api/v1/matches').set(authHeader(a.accessToken));
    const matchId = aMatches.body.find((m: { userId: string }) => m.userId === b.user.id).id;
    await request(app).post(`/api/v1/matches/${matchId}/messages`).set(authHeader(a.accessToken)).send({ content: 'hey' });

    await request(app).delete('/api/v1/users/me').set(authHeader(a.accessToken));

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    expect(match).toBeNull();
    const messages = await prisma.message.findMany({ where: { roomId: matchId } });
    expect(messages).toHaveLength(0);
    const swipes = await prisma.swipe.findMany({ where: { OR: [{ fromUserId: a.user.id }, { toUserId: a.user.id }] } });
    expect(swipes).toHaveLength(0);

    const bMatches = await request(app).get('/api/v1/matches').set(authHeader(b.accessToken));
    expect(bMatches.body.some((m: { userId: string }) => m.userId === a.user.id)).toBe(false);
  });

  it('deletes a pending dog-walk request and its messages along with the requester', async () => {
    const shelter = await devLoginAsShelter(unique('DeleteReqShelter'));
    const dog = await request(app)
      .post('/api/v1/dogs')
      .set(authHeader(shelter.accessToken))
      .send({ name: 'Bella', breed: 'Mixed', age: 2, personality: [] });
    const walker = await devLoginAs(unique('DeleteReqWalker'));
    const like = await request(app).post(`/api/v1/dogs/${dog.body.id}/like`).set(authHeader(walker.accessToken));
    await request(app).post(`/api/v1/dog-requests/${like.body.id}/accept`).set(authHeader(shelter.accessToken));
    await request(app)
      .post(`/api/v1/dog-requests/${like.body.id}/messages`)
      .set(authHeader(walker.accessToken))
      .send({ content: 'When can I visit?' });

    await request(app).delete('/api/v1/users/me').set(authHeader(walker.accessToken));

    const requestRow = await prisma.dogWalkRequest.findUnique({ where: { id: like.body.id } });
    expect(requestRow).toBeNull();
    const messages = await prisma.message.findMany({ where: { roomId: like.body.id } });
    expect(messages).toHaveLength(0);
  });

  it('reuses the same sentinel account across multiple deletions', async () => {
    const first = await devLoginAs(unique('SentinelA'));
    const walkA = await request(app)
      .post('/api/v1/walks')
      .set(authHeader(first.accessToken))
      .send({
        title: 'Sentinel walk A',
        meetingLat: 52.23,
        meetingLng: 21.01,
        meetingPoint: 'Park',
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
      });
    await request(app).post(`/api/v1/chat/${walkA.body.id}/messages`).set(authHeader(first.accessToken)).send({ content: 'first' });
    await request(app).delete('/api/v1/users/me').set(authHeader(first.accessToken));

    const second = await devLoginAs(unique('SentinelB'));
    const walkB = await request(app)
      .post('/api/v1/walks')
      .set(authHeader(second.accessToken))
      .send({
        title: 'Sentinel walk B',
        meetingLat: 52.23,
        meetingLng: 21.01,
        meetingPoint: 'Park',
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
      });
    await request(app).post(`/api/v1/chat/${walkB.body.id}/messages`).set(authHeader(second.accessToken)).send({ content: 'second' });
    await request(app).delete('/api/v1/users/me').set(authHeader(second.accessToken));

    const sentinels = await prisma.user.findMany({ where: { provider: 'system', displayName: 'Deleted user' } });
    expect(sentinels).toHaveLength(1);
  });
});
