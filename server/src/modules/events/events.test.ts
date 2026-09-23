import request from 'supertest';
import { app, authHeader, devLoginAs, unique } from '../../../test/helpers';

describe('events', () => {
  it('creates an event, lists it as joined for the organizer and not-joined for others, then supports join/leave', async () => {
    const organizer = await devLoginAs(unique('Organizer'));
    const attendee = await devLoginAs(unique('Attendee'));

    const create = await request(app)
      .post('/api/v1/events')
      .set(authHeader(organizer.accessToken))
      .send({
        title: 'Spring meetup',
        date: new Date(Date.now() + 86_400_000).toISOString(),
        location: 'Łazienki Park',
        lat: 52.21,
        lng: 21.03,
      });
    expect(create.status).toBe(201);
    expect(create.body.isJoined).toBe(true);
    expect(create.body.participantCount).toBe(1);

    const asAttendee = await request(app)
      .get(`/api/v1/events/${create.body.id}`)
      .set(authHeader(attendee.accessToken));
    expect(asAttendee.body.isJoined).toBe(false);

    const join = await request(app)
      .post(`/api/v1/events/${create.body.id}/join`)
      .set(authHeader(attendee.accessToken));
    expect(join.body.isJoined).toBe(true);
    expect(join.body.participantCount).toBe(2);

    const leave = await request(app)
      .post(`/api/v1/events/${create.body.id}/leave`)
      .set(authHeader(attendee.accessToken));
    expect(leave.body.isJoined).toBe(false);
    expect(leave.body.participantCount).toBe(1);
  });
});
