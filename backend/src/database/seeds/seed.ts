/**
 * Seed script — populates the database with test data.
 * Run with: yarn workspace backend db:seed
 */
import AppDataSource from '../data-source';
import { UserEntity, AuthProvider } from '../entities/user.entity';
import { WalkEntity, WalkStatus } from '../entities/walk.entity';
import { DogEntity } from '../entities/dog.entity';
import * as bcrypt from 'bcryptjs';

async function seed() {
  await AppDataSource.initialize();
  console.log('🌱 Connected to database — running seed…');

  const userRepo = AppDataSource.getRepository(UserEntity);
  const walkRepo = AppDataSource.getRepository(WalkEntity);
  const dogRepo  = AppDataSource.getRepository(DogEntity);

  // ── Users ──────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const alice = userRepo.create({
    email: 'alice@walkme.dev',
    passwordHash,
    displayName: 'Alice Walker',
    provider: AuthProvider.LOCAL,
  });

  const bob = userRepo.create({
    email: 'bob@walkme.dev',
    passwordHash,
    displayName: 'Bob Barker',
    provider: AuthProvider.LOCAL,
  });

  const [aliceSaved, bobSaved] = await userRepo.save([alice, bob]);
  console.log(`  ✅ Created users: ${aliceSaved.email}, ${bobSaved.email}`);

  // ── Dogs ───────────────────────────────────────────────────────────────────
  const dog1 = dogRepo.create({ owner: aliceSaved, name: 'Buddy',  breed: 'Golden Retriever', ageMonths: 24 });
  const dog2 = dogRepo.create({ owner: aliceSaved, name: 'Daisy',  breed: 'Labrador',         ageMonths: 12 });
  const dog3 = dogRepo.create({ owner: bobSaved,   name: 'Max',    breed: 'German Shepherd',  ageMonths: 36 });

  await dogRepo.save([dog1, dog2, dog3]);
  console.log('  ✅ Created dogs: Buddy, Daisy, Max');

  // ── Walks ──────────────────────────────────────────────────────────────────
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const walk1 = walkRepo.create({
    host: aliceSaved,
    title: 'Morning Park Stroll',
    description: 'Easy-paced 5 km walk around Central Park. Dog-friendly!',
    status: WalkStatus.PENDING,
    scheduledAt: tomorrow,
    maxParticipants: 8,
    category: 'Park',
    meetingPointAddress: 'Central Park South Entrance',
    meetingLat: 40.7681,
    meetingLng: -73.9817,
    participants: [aliceSaved, bobSaved],
  } as Partial<WalkEntity> as WalkEntity);

  const nextWeek = new Date(tomorrow);
  nextWeek.setDate(nextWeek.getDate() + 6);

  const walk2 = walkRepo.create({
    host: bobSaved,
    title: 'Trail Hike with Dogs',
    description: 'Moderate 8 km trail — bring water for your pups!',
    status: WalkStatus.PENDING,
    scheduledAt: nextWeek,
    maxParticipants: 6,
    category: 'Trail',
    meetingPointAddress: 'Riverside Trail Head',
    meetingLat: 40.7831,
    meetingLng: -73.9712,
    participants: [bobSaved],
  } as Partial<WalkEntity> as WalkEntity);

  await walkRepo.save([walk1, walk2]);
  console.log('  ✅ Created walks: Morning Park Stroll, Trail Hike with Dogs');

  await AppDataSource.destroy();
  console.log('✅ Seed complete');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
