import request from 'supertest';
import { app, unique } from '../../../test/helpers';

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
});
