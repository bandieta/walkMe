// Creates (or updates the password of) the first admin account from env vars.
// Idempotent — safe to run on every deploy. Run manually with:
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... npx tsx prisma/seed-admin.ts
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const displayName = process.env.ADMIN_NAME ?? 'Admin';

  if (!email || !password) {
    console.log('ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed.');
    return;
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, displayName },
    create: { email, passwordHash, displayName, role: 'superadmin' },
  });
  console.log(`Admin account ready: ${admin.email} (${admin.role}).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
