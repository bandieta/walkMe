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

  it('never serves an upload back as HTML, whatever its original filename', async () => {
    const { accessToken } = await devLoginAs(unique('Sneaky'));
    const upload = await request(app)
      .post('/api/v1/storage/upload')
      .set(authHeader(accessToken))
      .attach('file', Buffer.from('<script>alert(1)</script>'), { filename: 'x.html', contentType: 'image/png' });
    expect(upload.status).toBe(201);
    expect(upload.body.url).toMatch(/\.png$/);

    const fetched = await request(app).get(`/uploads/${upload.body.url.split('/uploads/')[1]}`);
    expect(fetched.headers['content-type']).not.toMatch(/html/);
    expect(fetched.headers['x-content-type-options']).toBe('nosniff');
  });

  it('rejects image types it cannot safely serve (e.g. SVG)', async () => {
    const { accessToken } = await devLoginAs(unique('SvgUploader'));
    const upload = await request(app)
      .post('/api/v1/storage/upload')
      .set(authHeader(accessToken))
      .attach('file', Buffer.from('<svg onload="alert(1)"/>'), { filename: 'a.svg', contentType: 'image/svg+xml' });
    expect(upload.status).toBe(400);
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
