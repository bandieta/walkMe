import request from 'supertest';
import { app, unique } from '../../../test/helpers';
import { env } from '../../config/env';

describe('auth', () => {
  it('logs in via /auth/dev-login and returns a usable access token', async () => {
    const name = unique('DevUser');
    const res = await request(app).post('/api/v1/auth/dev-login').send({ displayName: name });
    expect(res.status).toBe(200);
    expect(res.body.user.displayName).toBe(name);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();

    const me = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${res.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.displayName).toBe(name);
  });

  it('reuses the same dev user for the same display name', async () => {
    const name = unique('SameUser');
    const first = await request(app).post('/api/v1/auth/dev-login').send({ displayName: name });
    const second = await request(app).post('/api/v1/auth/dev-login').send({ displayName: name });
    expect(first.body.user.id).toBe(second.body.user.id);
  });

  it('rejects requests without a bearer token', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });

  it('refreshes and rotates the refresh token', async () => {
    const login = await request(app).post('/api/v1/auth/dev-login').send({ displayName: unique('Refresher') });
    const refreshed = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: login.body.refreshToken });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.accessToken).toBeTruthy();

    // Old refresh token is rotated out and can no longer be used.
    const reuse = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: login.body.refreshToken });
    expect(reuse.status).toBe(401);
  });

  it('logs out and invalidates the refresh token', async () => {
    const login = await request(app).post('/api/v1/auth/dev-login').send({ displayName: unique('Loggerout') });
    const logout = await request(app).post('/api/v1/auth/logout').send({ refreshToken: login.body.refreshToken });
    expect(logout.status).toBe(200);

    const refreshAfterLogout = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.body.refreshToken });
    expect(refreshAfterLogout.status).toBe(401);
  });

  it('rejects social login for an unconfigured provider gracefully', async () => {
    const res = await request(app).post('/api/v1/auth/social').send({ provider: 'google', token: 'not-a-real-token' });
    expect([401, 500]).toContain(res.status);
  });

  describe('email sign-in', () => {
    it('signs up, then signs back in, with the code from /start (no RESEND_API_KEY in tests, so devCode is returned)', async () => {
      const email = `${unique('newbie')}@example.com`;

      const start = await request(app).post('/api/v1/auth/email/start').send({ email });
      expect(start.status).toBe(200);
      expect(start.body.devCode).toMatch(/^\d{6}$/);

      const verify = await request(app)
        .post('/api/v1/auth/email/verify')
        .send({ email, code: start.body.devCode, displayName: 'New Bee' });
      expect(verify.status).toBe(200);
      expect(verify.body.user.email).toBe(email);
      expect(verify.body.user.displayName).toBe('New Bee');
      expect(verify.body.accessToken).toBeTruthy();

      // Signing in again reuses the same account and its saved name (displayName isn't required or applied a second time).
      const start2 = await request(app).post('/api/v1/auth/email/start').send({ email });
      const verify2 = await request(app).post('/api/v1/auth/email/verify').send({ email, code: start2.body.devCode });
      expect(verify2.body.user.id).toBe(verify.body.user.id);
      expect(verify2.body.user.displayName).toBe('New Bee');
    });

    it('rejects a wrong code', async () => {
      const email = `${unique('wrongcode')}@example.com`;
      await request(app).post('/api/v1/auth/email/start').send({ email });
      const res = await request(app).post('/api/v1/auth/email/verify').send({ email, code: '000000' });
      expect(res.status).toBe(400);
    });

    it('rejects a code once it has been used', async () => {
      const email = `${unique('reuse')}@example.com`;
      const start = await request(app).post('/api/v1/auth/email/start').send({ email });
      const first = await request(app).post('/api/v1/auth/email/verify').send({ email, code: start.body.devCode });
      expect(first.status).toBe(200);
      const second = await request(app).post('/api/v1/auth/email/verify').send({ email, code: start.body.devCode });
      expect(second.status).toBe(400);
    });

    it('throttles rapid re-requests for the same email', async () => {
      const email = `${unique('cooldown')}@example.com`;
      await request(app).post('/api/v1/auth/email/start').send({ email });
      const res = await request(app).post('/api/v1/auth/email/start').send({ email });
      expect(res.status).toBe(429);
    });

    it('reports a failed send clearly and lets the user retry straight away', async () => {
      const email = `${unique('bounce')}@example.com`;
      const realFetch = global.fetch;
      env.resendApiKey = 're_test';
      global.fetch = jest.fn(async () => new Response('{"statusCode":403}', { status: 403 })) as typeof fetch;
      try {
        const res = await request(app).post('/api/v1/auth/email/start').send({ email });
        expect(res.status).toBe(502);
        expect(res.body.error.code).toBe('EMAIL_SEND_FAILED');
        expect(res.body.devCode).toBeUndefined();
      } finally {
        global.fetch = realFetch;
        env.resendApiKey = '';
      }

      // No leftover code, so the cooldown doesn't block an immediate retry.
      const retry = await request(app).post('/api/v1/auth/email/start').send({ email });
      expect(retry.status).toBe(200);
    });
  });
});
