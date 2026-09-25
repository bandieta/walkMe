// Plain JS (not transformed by ts-jest) — Jest runs this once in the main
// process before spawning test workers, and workers inherit the env vars
// set here. Gives every test run a fresh, schema-synced SQLite file.
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = async () => {
  const dbPath = path.join(__dirname, '..', 'prisma', 'test.db');
  for (const suffix of ['', '-journal']) {
    const p = dbPath + suffix;
    if (fs.existsSync(p)) fs.rmSync(p);
  }

  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = `file:${dbPath}`;
  process.env.ALLOW_DEV_LOGIN = 'true';
  process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.UPLOAD_DIR = path.join(__dirname, '..', 'test-uploads');
  // Blank the external-provider settings so a real server/.env (loaded by dotenv, which never
  // overrides what's already set) can't make tests call Resend or Facebook for real.
  process.env.RESEND_API_KEY = '';
  process.env.FACEBOOK_APP_ID = '';
  process.env.FACEBOOK_APP_SECRET = '';
  process.env.GOOGLE_CLIENT_ID = '';

  const cwd = path.join(__dirname, '..');
  execSync('npx prisma db push --skip-generate --accept-data-loss', { cwd, env: process.env, stdio: 'inherit' });
  execSync('npx tsx prisma/seed.ts', { cwd, env: process.env, stdio: 'inherit' });
};
