// Demo content taken from the design prototype ("WalkMe Prototype", direction 1b), so the app shows the same
// people, dogs, walks, events and messages as the design. Run: npm run seed:demo
// Resets demo users (provider "dev"/"filler") and everything hanging off them; leaves real accounts and Places alone.
import { PrismaClient } from '@prisma/client';
import data from './demo-data.json';

const prisma = new PrismaClient();
const HOUR = 3_600_000;
const at = (hoursFromNow: number, hh?: number, mm?: number) => {
  const d = new Date(Date.now() + hoursFromNow * HOUR);
  if (hh !== undefined) d.setHours(hh, mm ?? 0, 0, 0);
  return d;
};
// Warsaw coordinates for the prototype's named locations.
const GEO: Record<string, [number, number]> = {
  w3: [52.2185, 20.9978], w1: [52.2146, 21.035], w2: [52.1407, 21.0634], w4: [52.1675, 21.0898], w5: [52.2547, 21.0539], w6: [52.2297, 21.0122],
  e4: [52.4283, 21.0539], e3: [52.2547, 21.0539], e1: [52.2146, 21.035], e2: [52.1558, 21.0412], e6: [52.2497, 21.0122], e5: [52.2185, 20.9978],
};
// Home areas for the Discover deck: Alex lives in Mokotów, everyone else sits `dist` km away (from the prototype) on a fixed bearing.
const HOME: [number, number] = [52.212, 21.0];
const homeOf = (key: string, dist?: string): [number, number] | null => {
  if (key === 'u0') return HOME;
  const km = parseFloat(dist ?? '');
  if (!Number.isFinite(km)) return null;
  const bearing = ((Number(key.slice(1)) * 47) % 360) * (Math.PI / 180);
  return [HOME[0] + (km * Math.cos(bearing)) / 111.195, HOME[1] + (km * Math.sin(bearing)) / (111.195 * Math.cos((HOME[0] * Math.PI) / 180))];
};
const WALK_TIME: Record<string, Date> = { w3: at(0, 9, 15), w1: at(2), w2: at(26), w4: at(50), w5: at(75), w6: at(-3) };
const EVENT_TIME: Record<string, Date> = { e4: at(0, 10, 0), e3: at(48), e1: at(72), e2: at(120), e6: at(168), e5: at(-24) };

async function main() {
  const old = await prisma.user.findMany({ where: { provider: { in: ['dev', 'filler'] } }, select: { id: true } });
  const ids = old.map((u) => u.id);
  await prisma.message.deleteMany({ where: { senderId: { in: ids } } });
  await prisma.swipe.deleteMany({ where: { OR: [{ fromUserId: { in: ids } }, { toUserId: { in: ids } }] } });
  await prisma.match.deleteMany({ where: { OR: [{ userAId: { in: ids } }, { userBId: { in: ids } }] } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } }); // cascades dogs, walks, events, participants

  const users: Record<string, string> = {};
  for (const [key, u] of Object.entries<any>(data.U)) {
    const name: string = u.name;
    const created = await prisma.user.create({
      data: {
        provider: 'dev',
        providerId: `dev-${name.toLowerCase().replace(/\s+/g, '-')}`, // matches POST /auth/dev-login for that display name
        displayName: name,
        age: u.age ?? null,
        location: u.loc ? (key === 'u0' ? 'Mokotów, Warsaw' : `${u.loc}, Warsaw`) : null,
        bio: key === 'u0' ? 'Morning walker. Coffee and paws. Luna keeps me sane.' : u.bio ?? null,
        onboardedAt: new Date(),
        walkTimes: JSON.stringify(['morning', 'evening']),
        radiusKm: 2,
        lat: homeOf(key, u.dist)?.[0] ?? null,
        lng: homeOf(key, u.dist)?.[1] ?? null,
      },
    });
    users[key] = created.id;
    const dog = u.dog;
    if (dog) {
      await prisma.dog.create({
        data: {
          ownerId: created.id,
          name: dog.name,
          breed: dog.breed,
          age: typeof dog.age === 'number' ? dog.age : 3,
          ageGroup: 'Adult',
          energy: key === 'u0' ? 'High' : 'Balanced',
          personality: JSON.stringify(key === 'u0' ? data.LUNA.temps : dog.tags ?? []),
        },
      });
    }
  }

  // Filler accounts so participant counts ("28 going") match the design. Excluded from the discover deck.
  const fillers: string[] = [];
  for (let i = 1; i <= 48; i++) {
    const f = await prisma.user.create({ data: { provider: 'filler', providerId: `filler-${i}`, displayName: `Guest ${i}` } });
    fillers.push(f.id);
  }

  const walkIds: Record<string, string> = {};
  for (const w of data.WALKS as any[]) {
    const [lat, lng] = GEO[w.id];
    const created = await prisma.walk.create({
      data: {
        title: w.title, description: w.desc, category: w.cat, hostId: users[w.host], meetingLat: lat, meetingLng: lng,
        meetingPoint: w.point, scheduledAt: WALK_TIME[w.id], maxParticipants: w.max, status: w.status, duration: w.dur,
        participants: { create: (w.parts as string[]).map((p) => ({ userId: users[p] })) },
      },
    });
    walkIds[w.id] = created.id;
  }

  for (const e of data.EVENTS as any[]) {
    const [lat, lng] = GEO[e.id];
    const going: string[] = [users[e.org]];
    if (e.joined) going.push(users.u0);
    for (let i = 0; going.length < e.going; i++) going.push(fillers[i % fillers.length]);
    await prisma.event.create({
      data: {
        title: e.title, description: e.desc, date: EVENT_TIME[e.id], location: e.point, lat, lng, organizerId: users[e.org],
        maxParticipants: e.max, status: e.status, category: e.cat, photoCaption: e.photo,
        participants: { create: [...new Set(going)].map((userId) => ({ userId })) },
      },
    });
  }

  // Matches + messages: m1..m3 are direct threads with u1, u5, u9; w1/w3 are walk group chats.
  const pair = (a: string, b: string): [string, string] => (a < b ? [a, b] : [b, a]);
  const matchOf: Record<string, string> = {};
  const matched = { m1: 'u1', m2: 'u5', m3: 'u9', m4: 'u3', m5: 'u7' } as Record<string, string>;
  // The chat list of the design: m3 wrote 3 h ago, m1 yesterday, m2 on Monday (3 days ago); Monika (m4) matched after Anna (m5).
  const LAST_AT: Record<string, number> = { m3: -3, m1: -24, m2: -72 };
  const MATCHED_AT: Record<string, number> = { m4: -24, m5: -25 };
  for (const [mid, uk] of Object.entries(matched)) {
    const [userAId, userBId] = pair(users.u0, users[uk]);
    const m = await prisma.match.create({ data: { userAId, userBId, matchedAt: at(MATCHED_AT[mid] ?? -25) } });
    matchOf[mid] = m.id;
    await prisma.swipe.createMany({ data: [
      { fromUserId: users.u0, toUserId: users[uk], direction: 'right' },
      { fromUserId: users[uk], toUserId: users.u0, direction: 'right' },
    ] });
  }
  // Alex has already passed on real (non-demo) accounts, so the deck starts with the prototype's cards (u2, u4, u6, u8).
  const real = await prisma.user.findMany({ where: { provider: { notIn: ['dev', 'filler'] } }, select: { id: true } });
  if (real.length) await prisma.swipe.createMany({ data: real.map((r) => ({ fromUserId: users.u0, toUserId: r.id, direction: 'left' })) });
  const say = async (roomId: string, walkId: string | null, fromKey: string, text: string, hoursAgo: number) =>
    prisma.message.create({ data: { roomId, walkId, senderId: users[fromKey], content: text, createdAt: at(-hoursAgo) } });
  for (const [room, list] of Object.entries<any[]>(data.MSGS)) {
    const isWalk = room.startsWith('w');
    const roomId = isWalk ? walkIds[room] : matchOf[room];
    let h = list.length + 1;
    for (const m of list) { await say(roomId, isWalk ? roomId : null, m.from, m.text, h--); }
    if (!isWalk && list.length) {
      const last = list[list.length - 1];
      const iAmA = pair(users.u0, users[matched[room]])[0] === users.u0;
      await prisma.match.update({ where: { id: roomId }, data: {
        lastMessage: last.text, lastMessageAt: at(LAST_AT[room] ?? -1),
        // Only m3 and m1 are unread in the design (m2 was read).
        ...(last.from !== 'u0' && room !== 'm2' ? (iAmA ? { unreadForA: 1 } : { unreadForB: 1 }) : {}),
      } });
    }
  }
  console.log(`Demo data seeded: ${Object.keys(users).length} people, ${data.WALKS.length} walks, ${data.EVENTS.length} events. Sign in as "Alex Johnson".`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
