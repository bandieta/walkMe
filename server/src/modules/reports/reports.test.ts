import request from 'supertest';
import { app, authHeader, devLoginAs, unique } from '../../../test/helpers';
import { prisma } from '../../lib/prisma';

describe('reports', () => {
  it('creates a report against another user and stores it as open', async () => {
    const reporter = await devLoginAs(unique('Reporter'));
    const target = await devLoginAs(unique('ReportTarget'));

    const res = await request(app)
      .post('/api/v1/reports')
      .set(authHeader(reporter.accessToken))
      .send({ targetType: 'user', targetId: target.user.id, reason: 'harassment', details: 'Sent unwanted messages.' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.createdAt).toBeDefined();

    const stored = await prisma.report.findUnique({ where: { id: res.body.id } });
    expect(stored?.reporterId).toBe(reporter.user.id);
    expect(stored?.targetType).toBe('user');
    expect(stored?.targetId).toBe(target.user.id);
    expect(stored?.reason).toBe('harassment');
    expect(stored?.status).toBe('open');
  });

  it('rejects an unknown target type or reason, and requires a targetId', async () => {
    const reporter = await devLoginAs(unique('BadReporter'));

    const badType = await request(app)
      .post('/api/v1/reports')
      .set(authHeader(reporter.accessToken))
      .send({ targetType: 'spaceship', targetId: 'x', reason: 'spam' });
    expect(badType.status).toBe(400);

    const badReason = await request(app)
      .post('/api/v1/reports')
      .set(authHeader(reporter.accessToken))
      .send({ targetType: 'walk', targetId: 'x', reason: 'because' });
    expect(badReason.status).toBe(400);

    const missingTarget = await request(app)
      .post('/api/v1/reports')
      .set(authHeader(reporter.accessToken))
      .send({ targetType: 'walk', reason: 'spam' });
    expect(missingTarget.status).toBe(400);
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/v1/reports').send({ targetType: 'user', targetId: 'x', reason: 'spam' });
    expect(res.status).toBe(401);
  });
});
