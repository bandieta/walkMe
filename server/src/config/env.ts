import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: Number(process.env.PORT ?? 4000),
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? 'http://localhost:4000',

  jwtAccessSecret: required('JWT_ACCESS_SECRET', 'dev-insecure-access-secret'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET', 'dev-insecure-refresh-secret'),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '2h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',

  allowDevLogin: process.env.ALLOW_DEV_LOGIN === 'true',

  // Admin panel — a separate secret so an app-user access token can never be
  // replayed as an admin token even if a payload shape ever collided.
  jwtAdminSecret: required('JWT_ADMIN_SECRET', 'dev-insecure-admin-secret'),
  jwtAdminExpiresIn: process.env.JWT_ADMIN_EXPIRES_IN ?? '12h',

  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  facebookAppId: process.env.FACEBOOK_APP_ID ?? '',
  facebookAppSecret: process.env.FACEBOOK_APP_SECRET ?? '',
  appleBundleId: process.env.APPLE_BUNDLE_ID ?? 'com.walkme',

  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
};
