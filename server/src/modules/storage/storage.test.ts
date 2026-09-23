import request from 'supertest';
import { app, authHeader, devLoginAs, unique } from '../../../test/helpers';

describe('storage', () => {
  it('uploads an image and serves it back from the returned url', async () => {
    const { accessToken } = await devLoginAs(unique('Uploader'));

    const upload = await request(app)
      .post('/api/v1/storage/upload')
      .set(authHeader(accessToken))
      .attach('file', Buffer.from([0x89, 0x50, 0x4e, 0x47]), { filename: 'avatar.png', contentType: 'image/png' });
    expect(upload.status).toBe(201);
    expect(upload.body.url).toMatch(/\/uploads\/.+\.png$/);

    const filename = upload.body.url.split('/uploads/')[1];
    const fetched = await request(app).get(`/uploads/${filename}`);
    expect(fetched.status).toBe(200);
  });

  it('rejects non-image uploads', async () => {
    const { accessToken } = await devLoginAs(unique('BadUploader'));
    const upload = await request(app)
      .post('/api/v1/storage/upload')
      .set(authHeader(accessToken))
      .attach('file', Buffer.from('not an image'), { filename: 'notes.txt', contentType: 'text/plain' });
    expect(upload.status).toBe(400);
  });
});
