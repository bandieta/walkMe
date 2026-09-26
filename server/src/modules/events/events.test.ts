import request from 'supertest';
import { app, authHeader, devLoginAs, devLoginAsShelter, unique } from '../../../test/helpers';

async function addDog(accessToken: string, name: string) {
  const res = await request(app)
    .post('/api/v1/dogs')
    .set(authHeader(accessToken))
    .send({ name, breed: 'Mixed', age: 3, personality: [] });
  return res.body as { id: string };
}

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

  it('creates an event with more than one dog for the organizer', async () => {
    const organizer = await devLoginAs(unique('MultiDogOrganizer'));
    const luna = await addDog(organizer.accessToken, 'Luna');
    const rex = await addDog(organizer.accessToken, 'Rex');

    const create = await request(app)
      .post('/api/v1/events')
      .set(authHeader(organizer.accessToken))
      .send({
        title: 'Puppy social',
        date: new Date(Date.now() + 86_400_000).toISOString(),
        location: 'Łazienki Park',
        lat: 52.21,
        lng: 21.03,
        dogIds: [luna.id, rex.id],
      });
    expect(create.status).toBe(201);
    expect(create.body.myDogIds.sort()).toEqual([luna.id, rex.id].sort());
    expect(create.body.participantDogs[organizer.user.id].map((d: { name: string }) => d.name).sort()).toEqual(['Luna', 'Rex']);
  });

  it('joins an event with several dogs, and rejoining with a new set replaces it ("edit my dogs")', async () => {
    const organizer = await devLoginAs(unique('EditDogsOrganizer'));
    const attendee = await devLoginAs(unique('EditDogsAttendee'));
    const buddy = await addDog(attendee.accessToken, 'Buddy');
    const coco = await addDog(attendee.accessToken, 'Coco');

    const create = await request(app)
      .post('/api/v1/events')
      .set(authHeader(organizer.accessToken))
      .send({
        title: 'Dog park meetup',
        date: new Date(Date.now() + 86_400_000).toISOString(),
        location: 'Park',
        lat: 52.2,
        lng: 21.0,
      });
    const eventId = create.body.id;

    const join = await request(app)
      .post(`/api/v1/events/${eventId}/join`)
      .set(authHeader(attendee.accessToken))
      .send({ dogIds: [buddy.id, coco.id] });
    expect(join.body.myDogIds.sort()).toEqual([buddy.id, coco.id].sort());

    // Rejoining (already a participant) with just one dog replaces the pair rather than adding to it.
    const rejoin = await request(app)
      .post(`/api/v1/events/${eventId}/join`)
      .set(authHeader(attendee.accessToken))
      .send({ dogIds: [buddy.id] });
    expect(rejoin.status).toBe(200);
    expect(rejoin.body.myDogIds).toEqual([buddy.id]);
    expect(rejoin.body.participantCount).toBe(2); // still just organizer + attendee, not duplicated

    // A plain re-join with no dogIds field at all leaves the existing selection alone.
    const noop = await request(app).post(`/api/v1/events/${eventId}/join`).set(authHeader(attendee.accessToken));
    expect(noop.body.myDogIds).toEqual([buddy.id]);

    const leave = await request(app).post(`/api/v1/events/${eventId}/leave`).set(authHeader(attendee.accessToken));
    expect(leave.body.participantDogs[attendee.user.id]).toBeUndefined();
  });

  it('lets a shelter-approved dog be brought to an event, but rejects a dog the user has no claim to', async () => {
    const shelter = await devLoginAsShelter(unique('EventShelter'));
    const shelterDog = await addDog(shelter.accessToken, 'Milo');
    const walker = await devLoginAs(unique('EventWalker'));
    const like = await request(app).post(`/api/v1/dogs/${shelterDog.id}/like`).set(authHeader(walker.accessToken));
    await request(app).post(`/api/v1/dog-requests/${like.body.id}/accept`).set(authHeader(shelter.accessToken));

    const organizer = await devLoginAs(unique('ShelterDogEventOrganizer'));
    const create = await request(app)
      .post('/api/v1/events')
      .set(authHeader(organizer.accessToken))
      .send({
        title: 'Adoptable dogs day',
        date: new Date(Date.now() + 86_400_000).toISOString(),
        location: 'Park',
        lat: 52.2,
        lng: 21.0,
      });

    const joinWithApprovedDog = await request(app)
      .post(`/api/v1/events/${create.body.id}/join`)
      .set(authHeader(walker.accessToken))
      .send({ dogIds: [shelterDog.id] });
    expect(joinWithApprovedDog.status).toBe(200);
    expect(joinWithApprovedDog.body.myDogIds).toEqual([shelterDog.id]);

    const strangerDog = await addDog(organizer.accessToken, 'NotYours');
    const otherWalker = await devLoginAs(unique('EventOtherWalker'));
    const rejected = await request(app)
      .post(`/api/v1/events/${create.body.id}/join`)
      .set(authHeader(otherWalker.accessToken))
      .send({ dogIds: [strangerDog.id] });
    expect(rejected.status).toBe(403);
  });
});
