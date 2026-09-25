import request from 'supertest';
import { app, authHeader, devLoginAs, unique } from '../../../test/helpers';
import * as adminService from '../admin/service';

describe('suspended and banned accounts', () => {
  it.each(['suspended', 'banned'] as const)('locks a %s user out of the API, token refresh and sign-in', async (status) => {
    const name = unique('Locked');
    const session = await devLoginAs(name);

    const before = await request(app).get('/api/v1/users/me').set(authHeader(session.accessToken));
    expect(before.status).toBe(200);

    await adminService.updateUser(session.user.id, { status });

    const api = await request(app).get('/api/v1/users/me').set(authHeader(session.accessToken));
    expect(api.status).toBe(403);
    expect(api.body.error.code).toBe('ACCOUNT_SUSPENDED');

    const refresh = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: session.refreshToken });
    expect(refresh.status).toBe(401);

    const relogin = await request(app).post('/api/v1/auth/dev-login').send({ displayName: name });
    expect(relogin.status).toBe(403);
  });

  it('lets a reinstated user sign in again', async () => {
    const name = unique('Reinstated');
    const session = await devLoginAs(name);
    await adminService.updateUser(session.user.id, { status: 'suspended' });
    await adminService.updateUser(session.user.id, { status: 'active' });

    const relogin = await request(app).post('/api/v1/auth/dev-login').send({ displayName: name });
    expect(relogin.status).toBe(200);
    const api = await request(app).get('/api/v1/users/me').set(authHeader(relogin.body.accessToken));
    expect(api.status).toBe(200);
  });
});
