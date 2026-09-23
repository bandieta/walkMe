import request from 'supertest';
import { app, unique } from '../../../test/helpers';
import { env } from '../../config/env';

const realFetch = global.fetch;

type MockHandler = { status?: number; body: unknown; image?: Buffer };

function mockGraph(handlers: Record<string, MockHandler>) {
  global.fetch = jest.fn(async (input: URL | RequestInfo) => {
    const path = new URL(String(input)).pathname;
    const handler = handlers[path];
    if (!handler) throw new Error(`unexpected call: ${path}`);
    if (handler.image) {
      return new Response(handler.image, { status: 200, headers: { 'content-type': 'image/jpeg' } });
    }
    return new Response(JSON.stringify(handler.body), { status: handler.status ?? 200 });
  }) as typeof fetch;
}

describe('facebook social login', () => {
  afterEach(() => {
    global.fetch = realFetch;
    env.facebookAppId = '';
    env.facebookAppSecret = '';
  });

  it('logs in with a valid Facebook token and reuses the account next time', async () => {
    const fbId = unique('fb');
    mockGraph({ '/me': { body: { id: fbId, name: 'Fay Book', email: 'fay@example.com' } } });

    const first = await request(app).post('/api/v1/auth/social').send({ provider: 'facebook', token: 't' });
    expect(first.status).toBe(200);
    expect(first.body.user.displayName).toBe('Fay Book');

    const me = await request(app).get('/api/v1/users/me').set('Authorization', `Bearer ${first.body.accessToken}`);
    expect(me.status).toBe(200);

    const second = await request(app).post('/api/v1/auth/social').send({ provider: 'facebook', token: 't' });
    expect(second.body.user.id).toBe(first.body.user.id);
  });

  it('rejects a token Facebook says is invalid', async () => {
    mockGraph({ '/me': { status: 400, body: { error: { message: 'Invalid OAuth access token' } } } });
    const res = await request(app).post('/api/v1/auth/social').send({ provider: 'facebook', token: 'bad' });
    expect(res.status).toBe(401);
  });

  it('rejects a valid token issued to a different Facebook app', async () => {
    env.facebookAppId = '111';
    env.facebookAppSecret = 'secret';
    mockGraph({
      '/debug_token': { body: { data: { app_id: '999', is_valid: true } } },
      '/me': { body: { id: 'x', name: 'Someone' } },
    });
    const res = await request(app).post('/api/v1/auth/social').send({ provider: 'facebook', token: 'other-app' });
    expect(res.status).toBe(401);
  });

  it('accepts a token issued to this app when strict checking is on', async () => {
    env.facebookAppId = '111';
    env.facebookAppSecret = 'secret';
    mockGraph({
      '/debug_token': { body: { data: { app_id: '111', is_valid: true } } },
      '/me': { body: { id: unique('fb'), name: 'Right App' } },
    });
    const res = await request(app).post('/api/v1/auth/social').send({ provider: 'facebook', token: 'ok' });
    expect(res.status).toBe(200);
  });

  it('saves the Facebook profile photo on our server and serves it', async () => {
    const fbId = unique('fbphoto').replace(/[^a-zA-Z0-9]/g, '');
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    mockGraph({
      '/me': {
        body: { id: fbId, name: 'Photo Person', picture: { data: { url: 'https://scontent.example/face.jpg' } } },
      },
      '/face.jpg': { body: null, image: jpeg },
    });

    const login = await request(app).post('/api/v1/auth/social').send({ provider: 'facebook', token: 't' });
    expect(login.status).toBe(200);
    expect(login.body.user.photoUrl).toBe(`/uploads/fb-${fbId}.jpg`);

    const file = await request(app).get(login.body.user.photoUrl);
    expect(file.status).toBe(200);
    expect(file.headers['content-type']).toMatch(/image\/jpeg/);
  });

  it('falls back to the original photo URL if the download fails', async () => {
    const fbId = unique('fbnophoto');
    mockGraph({
      '/me': { body: { id: fbId, name: 'No Copy', picture: { data: { url: 'https://scontent.example/gone.jpg' } } } },
      '/gone.jpg': { status: 404, body: {} },
    });
    const login = await request(app).post('/api/v1/auth/social').send({ provider: 'facebook', token: 't' });
    expect(login.body.user.photoUrl).toBe('https://scontent.example/gone.jpg');
  });
});
