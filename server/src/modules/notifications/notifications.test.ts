import request from 'supertest';
import { app, authHeader, devLoginAs, devLoginAsShelter, unique } from '../../../test/helpers';

async function addShelterDog(shelterToken: string, name: string) {
  const res = await request(app)
    .post('/api/v1/dogs')
    .set(authHeader(shelterToken))
    .send({ name, breed: 'Mixed', age: 3, personality: [] });
  return res.body as { id: string };
}

async function listNotifications(token: string) {
  const res = await request(app).get('/api/v1/notifications').set(authHeader(token));
  return res.body.items as { type: string; read: boolean; data?: { params?: Record<string, string>; target?: unknown } }[];
}

describe('notification preferences', () => {
  it('default to on for every category until the user touches them', async () => {
    const user = await devLoginAs(unique('DefaultPrefs'));
    const res = await request(app).get('/api/v1/notifications/preferences').set(authHeader(user.accessToken));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      matches: true,
      messages: true,
      walks: true,
      events: true,
      shelterRequests: true,
      nearby: true,
    });
  });

  it('persists a partial update and leaves the rest untouched', async () => {
    const user = await devLoginAs(unique('PartialPrefs'));
    const patch = await request(app)
      .put('/api/v1/notifications/preferences')
      .set(authHeader(user.accessToken))
      .send({ matches: false, nearby: false });
    expect(patch.status).toBe(200);
    expect(patch.body).toEqual({
      matches: false,
      messages: true,
      walks: true,
      events: true,
      shelterRequests: true,
      nearby: false,
    });

    const reread = await request(app).get('/api/v1/notifications/preferences').set(authHeader(user.accessToken));
    expect(reread.body).toEqual(patch.body);
  });
});

describe('notification feed', () => {
  it('a mutual swipe notifies both people, each with the other one as the deep-link target', async () => {
    const a = await devLoginAs(unique('SwipeA'));
    const b = await devLoginAs(unique('SwipeB'));

    await request(app).post(`/api/v1/discover/${b.user.id}/swipe-right`).set(authHeader(a.accessToken));
    await request(app).post(`/api/v1/discover/${a.user.id}/swipe-right`).set(authHeader(b.accessToken));

    const [notifsA, notifsB] = await Promise.all([listNotifications(a.accessToken), listNotifications(b.accessToken)]);
    const matchA = notifsA.find((n) => n.type === 'match');
    const matchB = notifsB.find((n) => n.type === 'match');
    expect(matchA?.data?.params?.name).toBe(b.user.displayName);
    expect(matchB?.data?.params?.name).toBe(a.user.displayName);
    expect(matchA?.read).toBe(false);
  });

  it('turning a category off stops that notification from being created at all — not just hiding it', async () => {
    const a = await devLoginAs(unique('OptOutA'));
    const b = await devLoginAs(unique('OptOutB'));
    await request(app).put('/api/v1/notifications/preferences').set(authHeader(b.accessToken)).send({ matches: false });

    await request(app).post(`/api/v1/discover/${b.user.id}/swipe-right`).set(authHeader(a.accessToken));
    await request(app).post(`/api/v1/discover/${a.user.id}/swipe-right`).set(authHeader(b.accessToken));

    const notifsB = await listNotifications(b.accessToken);
    expect(notifsB.find((n) => n.type === 'match')).toBeUndefined();
    const notifsA = await listNotifications(a.accessToken);
    expect(notifsA.find((n) => n.type === 'match')).toBeTruthy();
  });

  it('joining and leaving a walk notifies the host, but not the host notifying themself', async () => {
    const host = await devLoginAs(unique('WalkHost'));
    const guest = await devLoginAs(unique('WalkGuest'));

    const walk = await request(app)
      .post('/api/v1/walks')
      .set(authHeader(host.accessToken))
      .send({
        title: 'Evening stroll',
        meetingLat: 52.23,
        meetingLng: 21.01,
        meetingPoint: 'Park gate',
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
      });

    await request(app).post(`/api/v1/walks/${walk.body.id}/join`).set(authHeader(guest.accessToken)).send({});
    const afterJoin = await listNotifications(host.accessToken);
    const joined = afterJoin.find((n) => n.type === 'walk_joined');
    expect(joined?.data?.params?.name).toBe(guest.user.displayName);
    expect(joined?.data?.target).toEqual({ tab: 'MapTab', screen: 'WalkDetail', params: { walkId: walk.body.id } });

    await request(app).post(`/api/v1/walks/${walk.body.id}/leave`).set(authHeader(guest.accessToken));
    const afterLeave = await listNotifications(host.accessToken);
    expect(afterLeave.find((n) => n.type === 'walk_left')?.data?.params?.name).toBe(guest.user.displayName);

    // The host never gets a notification about their own join.
    expect(afterJoin.find((n) => n.type === 'walk_joined' && n.data?.params?.name === host.user.displayName)).toBeUndefined();
  });

  it('a walk created nearby notifies an opted-in, in-range neighbour but not someone out of range', async () => {
    const host = await devLoginAs(unique('NearbyHost'));
    const near = await devLoginAs(unique('NearbyNeighbour'));
    const far = await devLoginAs(unique('FarAway'));

    // ~1km from the meeting point below, with a 5km radius — should hear about it.
    await request(app).patch('/api/v1/users/me').set(authHeader(near.accessToken)).send({ lat: 52.24, lng: 21.02, radiusKm: 5 });
    // On another continent, same radius — should not.
    await request(app).patch('/api/v1/users/me').set(authHeader(far.accessToken)).send({ lat: -33.87, lng: 151.21, radiusKm: 5 });

    const walk = await request(app)
      .post('/api/v1/walks')
      .set(authHeader(host.accessToken))
      .send({
        title: 'Riverside walk',
        meetingLat: 52.23,
        meetingLng: 21.01,
        meetingPoint: 'River path',
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
      });
    expect(walk.status).toBe(201);

    const nearNotifs = await listNotifications(near.accessToken);
    expect(nearNotifs.find((n) => n.type === 'walk_nearby')).toBeTruthy();
    const farNotifs = await listNotifications(far.accessToken);
    expect(farNotifs.find((n) => n.type === 'walk_nearby')).toBeUndefined();
  });

  it('joining an event notifies the organiser', async () => {
    const organiser = await devLoginAs(unique('EventOrganiser'));
    const attendee = await devLoginAs(unique('EventAttendee'));

    const event = await request(app)
      .post('/api/v1/events')
      .set(authHeader(organiser.accessToken))
      .send({
        title: 'Puppy social',
        date: new Date(Date.now() + 3600_000).toISOString(),
        location: 'Community hall',
        lat: 52.23,
        lng: 21.01,
      });

    await request(app).post(`/api/v1/events/${event.body.id}/join`).set(authHeader(attendee.accessToken));
    const notifs = await listNotifications(organiser.accessToken);
    const joined = notifs.find((n) => n.type === 'event_joined');
    expect(joined?.data?.params?.name).toBe(attendee.user.displayName);
  });

  it('the full shelter walk-request lifecycle notifies the right side at each step', async () => {
    const shelter = await devLoginAsShelter(unique('NotifyShelter'));
    const dog = await addShelterDog(shelter.accessToken, 'Bella');
    const walker = await devLoginAs(unique('BellaFan'));

    const like = await request(app).post(`/api/v1/dogs/${dog.id}/like`).set(authHeader(walker.accessToken));
    const shelterNotifs = await listNotifications(shelter.accessToken);
    expect(shelterNotifs.find((n) => n.type === 'shelter_request')?.data?.params?.dogName).toBe('Bella');

    await request(app).post(`/api/v1/dog-requests/${like.body.id}/accept`).set(authHeader(shelter.accessToken));
    const walkerNotifsAfterAccept = await listNotifications(walker.accessToken);
    const accepted = walkerNotifsAfterAccept.find((n) => n.type === 'shelter_accepted');
    expect(accepted?.data?.target).toEqual({ tab: 'ChatTab', screen: 'DogRequestChat', params: { requestId: like.body.id } });

    await request(app)
      .post(`/api/v1/dog-requests/${like.body.id}/messages`)
      .set(authHeader(walker.accessToken))
      .send({ content: 'When can I visit?' });
    const shelterNotifsAfterMessage = await listNotifications(shelter.accessToken);
    const message = shelterNotifsAfterMessage.find((n) => n.type === 'message');
    expect(message?.data?.params?.name).toBe(walker.user.displayName);
  });

  it('the shelter can decline, notifying the requester', async () => {
    const shelter = await devLoginAsShelter(unique('DeclineShelter'));
    const dog = await addShelterDog(shelter.accessToken, 'Shadow');
    const walker = await devLoginAs(unique('ShadowFan2'));

    const like = await request(app).post(`/api/v1/dogs/${dog.id}/like`).set(authHeader(walker.accessToken));
    await request(app).post(`/api/v1/dog-requests/${like.body.id}/decline`).set(authHeader(shelter.accessToken));

    const notifs = await listNotifications(walker.accessToken);
    expect(notifs.find((n) => n.type === 'shelter_declined')?.data?.params?.dogName).toBe('Shadow');
  });

  it('unread count, mark-one-read and mark-all-read behave as expected', async () => {
    const host = await devLoginAs(unique('ReadStateHost'));
    const guestA = await devLoginAs(unique('ReadStateGuestA'));
    const guestB = await devLoginAs(unique('ReadStateGuestB'));

    const walk = await request(app)
      .post('/api/v1/walks')
      .set(authHeader(host.accessToken))
      .send({
        title: 'Read state walk',
        meetingLat: 52.23,
        meetingLng: 21.01,
        meetingPoint: 'Gate',
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
      });
    await request(app).post(`/api/v1/walks/${walk.body.id}/join`).set(authHeader(guestA.accessToken)).send({});
    await request(app).post(`/api/v1/walks/${walk.body.id}/join`).set(authHeader(guestB.accessToken)).send({});

    const countRes = await request(app).get('/api/v1/notifications/unread-count').set(authHeader(host.accessToken));
    expect(countRes.body.count).toBe(2);

    const notifs = await listNotifications(host.accessToken);
    const firstId = (notifs[0] as unknown as { id: string }).id;
    await request(app).post(`/api/v1/notifications/${firstId}/read`).set(authHeader(host.accessToken));
    const afterOne = await request(app).get('/api/v1/notifications/unread-count').set(authHeader(host.accessToken));
    expect(afterOne.body.count).toBe(1);

    await request(app).post('/api/v1/notifications/read-all').set(authHeader(host.accessToken));
    const afterAll = await request(app).get('/api/v1/notifications/unread-count').set(authHeader(host.accessToken));
    expect(afterAll.body.count).toBe(0);
  });

  it('marking a notification that belongs to someone else is rejected', async () => {
    const owner = await devLoginAs(unique('NotifOwner'));
    const stranger = await devLoginAs(unique('NotifStranger'));
    const other = await devLoginAs(unique('NotifOther'));

    await request(app).post(`/api/v1/discover/${other.user.id}/swipe-right`).set(authHeader(owner.accessToken));
    await request(app).post(`/api/v1/discover/${owner.user.id}/swipe-right`).set(authHeader(other.accessToken));

    const notifs = await listNotifications(owner.accessToken);
    const id = (notifs[0] as unknown as { id: string }).id;
    const res = await request(app).post(`/api/v1/notifications/${id}/read`).set(authHeader(stranger.accessToken));
    expect(res.status).toBe(404);
  });
});
