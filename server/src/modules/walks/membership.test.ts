import request from 'supertest';
import { app, authHeader, devLoginAs, unique } from '../../../test/helpers';

type Session = Awaited<ReturnType<typeof devLoginAs>>;

async function createWalk(host: Session, extra: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/v1/walks')
    .set(authHeader(host.accessToken))
    .send({
      title: unique('Walk'),
      meetingLat: 52.23,
      meetingLng: 21.01,
      meetingPoint: 'Park',
      scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
      ...extra,
    });
  return res.body as { id: string };
}

async function notificationsOfType(session: Session, type: string) {
  const res = await request(app).get('/api/v1/notifications').set(authHeader(session.accessToken));
  return (res.body.items as { type: string }[]).filter((n) => n.type === type);
}

describe('walk membership rules', () => {
  it('re-joining a walk you are already in does not notify the host again, even once it is full', async () => {
    const host = await devLoginAs(unique('RejoinHost'));
    const guest = await devLoginAs(unique('RejoinGuest'));
    const walk = await createWalk(host, { maxParticipants: 2 });

    const first = await request(app).post(`/api/v1/walks/${walk.id}/join`).set(authHeader(guest.accessToken)).send({});
    expect(first.status).toBe(200);
    const again = await request(app).post(`/api/v1/walks/${walk.id}/join`).set(authHeader(guest.accessToken)).send({});
    expect(again.status).toBe(200);

    expect(await notificationsOfType(host, 'walk_joined')).toHaveLength(1);
  });

  it('refuses to let anyone join a walk that has ended', async () => {
    const host = await devLoginAs(unique('EndedHost'));
    const late = await devLoginAs(unique('EndedLate'));
    const walk = await createWalk(host);
    await request(app).patch(`/api/v1/walks/${walk.id}/status`).set(authHeader(host.accessToken)).send({ status: 'ended' });

    const join = await request(app).post(`/api/v1/walks/${walk.id}/join`).set(authHeader(late.accessToken)).send({});
    expect(join.status).toBe(409);
  });

  it('does not let the host leave their own walk', async () => {
    const host = await devLoginAs(unique('LeaveHost'));
    const walk = await createWalk(host);
    const leave = await request(app).post(`/api/v1/walks/${walk.id}/leave`).set(authHeader(host.accessToken));
    expect(leave.status).toBe(400);
  });
});

describe('event membership rules', () => {
  async function createEvent(organizer: Session) {
    const res = await request(app)
      .post('/api/v1/events')
      .set(authHeader(organizer.accessToken))
      .send({ title: unique('Event'), date: new Date(Date.now() + 86_400_000).toISOString(), location: 'Park', lat: 52.2, lng: 21 });
    return res.body as { id: string };
  }

  it('re-joining an event does not notify the organizer again', async () => {
    const organizer = await devLoginAs(unique('EvOrg'));
    const guest = await devLoginAs(unique('EvGuest'));
    const event = await createEvent(organizer);
    await request(app).post(`/api/v1/events/${event.id}/join`).set(authHeader(guest.accessToken));
    await request(app).post(`/api/v1/events/${event.id}/join`).set(authHeader(guest.accessToken));
    expect(await notificationsOfType(organizer, 'event_joined')).toHaveLength(1);
  });

  it('does not let the organizer leave their own event', async () => {
    const organizer = await devLoginAs(unique('EvLeaveOrg'));
    const event = await createEvent(organizer);
    const leave = await request(app).post(`/api/v1/events/${event.id}/leave`).set(authHeader(organizer.accessToken));
    expect(leave.status).toBe(400);
  });
});
