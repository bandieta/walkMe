import request from 'supertest';
import { app } from '../test/helpers';

describe('health', () => {
  it('responds ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('serves the OpenAPI docs', async () => {
    const res = await request(app).get('/api/docs.json');
    expect(res.status).toBe(200);
    expect(res.body.paths).toBeDefined();
    expect(Object.keys(res.body.paths).length).toBeGreaterThan(10);
  });
});
