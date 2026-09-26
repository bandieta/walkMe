import { prisma } from '../../lib/prisma';
import { CreateReportInput } from './schema';

/** Reporting is fire-and-forget from the reporter's side — no status is ever returned to them beyond
 * "received"; only the admin panel's moderation queue (see admin/service.ts) sees `status`/`reviewedAt`. */
export async function createReport(reporterId: string, input: CreateReportInput) {
  const report = await prisma.report.create({ data: { reporterId, ...input } });
  return { id: report.id, createdAt: report.createdAt.toISOString() };
}
