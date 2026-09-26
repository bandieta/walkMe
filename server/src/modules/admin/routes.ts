import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { requireAdmin, requireSuperAdmin } from '../../middleware/adminAuth';
import * as adminService from './service';
import {
  adminLoginSchema,
  auditQuerySchema,
  createAdminSchema,
  createPlaceSchema,
  dogQuerySchema,
  eventQuerySchema,
  matchQuerySchema,
  messageQuerySchema,
  placeQuerySchema,
  updateEventSchema,
  updatePlaceSchema,
  updateUserSchema,
  updateWalkSchema,
  userQuerySchema,
  walkQuerySchema,
  reportQuerySchema,
  updateReportSchema,
} from './schema';

export const adminRouter = Router();

/**
 * @openapi
 * /admin/auth/login:
 *   post:
 *     summary: Admin panel login (email + password). Not used by the mobile app.
 *     tags: [Admin]
 */
adminRouter.post(
  '/auth/login',
  asyncHandler(async (req, res) => {
    const body = adminLoginSchema.parse(req.body);
    res.json(await adminService.adminLogin(body.email, body.password));
  }),
);

adminRouter.use(requireAdmin);

/**
 * @openapi
 * /admin/auth/me:
 *   get:
 *     summary: The signed-in admin's own profile.
 *     tags: [Admin]
 */
adminRouter.get(
  '/auth/me',
  asyncHandler(async (req, res) => {
    res.json(await adminService.getAdminById(req.adminId!));
  }),
);

/**
 * @openapi
 * /admin/stats:
 *   get:
 *     summary: Dashboard KPIs and a 30-day signup trend.
 *     tags: [Admin]
 */
adminRouter.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    res.json(await adminService.getDashboardStats());
  }),
);

// ── users ────────────────────────────────────────────────────────────────────

adminRouter.get(
  '/users',
  asyncHandler(async (req, res) => {
    const q = userQuerySchema.parse(req.query);
    res.json(await adminService.listUsers(q.q, q.status, q.provider, q.page, q.pageSize));
  }),
);

adminRouter.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    res.json(await adminService.getUserDetail(req.params.id));
  }),
);

adminRouter.patch(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const body = updateUserSchema.parse(req.body);
    const updated = await adminService.updateUser(req.params.id, body);
    if (body.status) await adminService.logAction(req.adminId!, 'user.status', 'User', req.params.id, { status: body.status });
    else await adminService.logAction(req.adminId!, 'user.update', 'User', req.params.id, body);
    res.json(updated);
  }),
);

adminRouter.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    await adminService.deleteUser(req.params.id);
    await adminService.logAction(req.adminId!, 'user.delete', 'User', req.params.id);
    res.json({ success: true });
  }),
);

// ── dogs ─────────────────────────────────────────────────────────────────────

adminRouter.get(
  '/dogs',
  asyncHandler(async (req, res) => {
    const q = dogQuerySchema.parse(req.query);
    res.json(await adminService.listDogs(q.q, q.ownerId, q.page, q.pageSize));
  }),
);

adminRouter.delete(
  '/dogs/:id',
  asyncHandler(async (req, res) => {
    await adminService.deleteDog(req.params.id);
    await adminService.logAction(req.adminId!, 'dog.delete', 'Dog', req.params.id);
    res.json({ success: true });
  }),
);

// ── walks ────────────────────────────────────────────────────────────────────

adminRouter.get(
  '/walks',
  asyncHandler(async (req, res) => {
    const q = walkQuerySchema.parse(req.query);
    res.json(await adminService.listWalks(q.q, q.status, q.page, q.pageSize));
  }),
);

adminRouter.get(
  '/walks/:id',
  asyncHandler(async (req, res) => {
    res.json(await adminService.getWalkDetail(req.params.id));
  }),
);

adminRouter.patch(
  '/walks/:id',
  asyncHandler(async (req, res) => {
    const body = updateWalkSchema.parse(req.body);
    const updated = await adminService.updateWalk(req.params.id, body);
    await adminService.logAction(req.adminId!, 'walk.update', 'Walk', req.params.id, body);
    res.json(updated);
  }),
);

adminRouter.delete(
  '/walks/:id',
  asyncHandler(async (req, res) => {
    await adminService.deleteWalk(req.params.id);
    await adminService.logAction(req.adminId!, 'walk.delete', 'Walk', req.params.id);
    res.json({ success: true });
  }),
);

// ── events ───────────────────────────────────────────────────────────────────

adminRouter.get(
  '/events',
  asyncHandler(async (req, res) => {
    const q = eventQuerySchema.parse(req.query);
    res.json(await adminService.listEvents(q.q, q.status, q.page, q.pageSize));
  }),
);

adminRouter.get(
  '/events/:id',
  asyncHandler(async (req, res) => {
    res.json(await adminService.getEventDetail(req.params.id));
  }),
);

adminRouter.patch(
  '/events/:id',
  asyncHandler(async (req, res) => {
    const body = updateEventSchema.parse(req.body);
    const updated = await adminService.updateEvent(req.params.id, body);
    await adminService.logAction(req.adminId!, 'event.update', 'Event', req.params.id, body);
    res.json(updated);
  }),
);

adminRouter.delete(
  '/events/:id',
  asyncHandler(async (req, res) => {
    await adminService.deleteEvent(req.params.id);
    await adminService.logAction(req.adminId!, 'event.delete', 'Event', req.params.id);
    res.json({ success: true });
  }),
);

// ── places ───────────────────────────────────────────────────────────────────

adminRouter.get(
  '/places',
  asyncHandler(async (req, res) => {
    const q = placeQuerySchema.parse(req.query);
    res.json(await adminService.listPlaces(q.q, q.category, q.page, q.pageSize));
  }),
);

adminRouter.post(
  '/places',
  asyncHandler(async (req, res) => {
    const body = createPlaceSchema.parse(req.body);
    const place = await adminService.createPlace(body);
    await adminService.logAction(req.adminId!, 'place.create', 'Place', place.id, { name: place.name });
    res.status(201).json(place);
  }),
);

adminRouter.patch(
  '/places/:id',
  asyncHandler(async (req, res) => {
    const body = updatePlaceSchema.parse(req.body);
    const updated = await adminService.updatePlace(req.params.id, body);
    await adminService.logAction(req.adminId!, 'place.update', 'Place', req.params.id, body);
    res.json(updated);
  }),
);

adminRouter.delete(
  '/places/:id',
  asyncHandler(async (req, res) => {
    await adminService.deletePlace(req.params.id);
    await adminService.logAction(req.adminId!, 'place.delete', 'Place', req.params.id);
    res.json({ success: true });
  }),
);

// ── messages (chat moderation) ──────────────────────────────────────────────

adminRouter.get(
  '/messages',
  asyncHandler(async (req, res) => {
    const q = messageQuerySchema.parse(req.query);
    res.json(await adminService.listMessages(q.q, q.userId, q.walkId, q.page, q.pageSize));
  }),
);

adminRouter.delete(
  '/messages/:id',
  asyncHandler(async (req, res) => {
    await adminService.deleteMessage(req.params.id);
    await adminService.logAction(req.adminId!, 'message.delete', 'Message', req.params.id);
    res.json({ success: true });
  }),
);

// ── matches ──────────────────────────────────────────────────────────────────

adminRouter.get(
  '/matches',
  asyncHandler(async (req, res) => {
    const q = matchQuerySchema.parse(req.query);
    res.json(await adminService.listMatches(q.q, q.page, q.pageSize));
  }),
);

adminRouter.delete(
  '/matches/:id',
  asyncHandler(async (req, res) => {
    await adminService.deleteMatch(req.params.id);
    await adminService.logAction(req.adminId!, 'match.delete', 'Match', req.params.id);
    res.json({ success: true });
  }),
);

// ── uploads ──────────────────────────────────────────────────────────────────

adminRouter.get(
  '/uploads',
  asyncHandler(async (_req, res) => {
    res.json(await adminService.listUploads());
  }),
);

adminRouter.delete(
  '/uploads/:name',
  asyncHandler(async (req, res) => {
    await adminService.deleteUpload(req.params.name);
    await adminService.logAction(req.adminId!, 'upload.delete', 'Upload', req.params.name);
    res.json({ success: true });
  }),
);

// ── audit log ────────────────────────────────────────────────────────────────

adminRouter.get(
  '/audit',
  asyncHandler(async (req, res) => {
    const q = auditQuerySchema.parse(req.query);
    res.json(await adminService.listAuditLog(q.page, q.pageSize, q.targetType));
  }),
);

// ── admin accounts (superadmin only) ────────────────────────────────────────

adminRouter.get(
  '/admins',
  requireSuperAdmin,
  asyncHandler(async (_req, res) => {
    res.json(await adminService.listAdmins());
  }),
);

adminRouter.post(
  '/admins',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const body = createAdminSchema.parse(req.body);
    const admin = await adminService.createAdmin(body);
    await adminService.logAction(req.adminId!, 'admin.create', 'AdminUser', admin.id, { email: admin.email, role: admin.role });
    res.status(201).json(admin);
  }),
);

adminRouter.delete(
  '/admins/:id',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    await adminService.deleteAdmin(req.params.id, req.adminId!);
    await adminService.logAction(req.adminId!, 'admin.delete', 'AdminUser', req.params.id);
    res.json({ success: true });
  }),
);

// ── reports (moderation queue) ────────────────────────────────────────────────

adminRouter.get(
  '/reports',
  asyncHandler(async (req, res) => {
    const q = reportQuerySchema.parse(req.query);
    res.json(await adminService.listReports(q.status, q.targetType, q.page, q.pageSize));
  }),
);

adminRouter.patch(
  '/reports/:id',
  asyncHandler(async (req, res) => {
    const body = updateReportSchema.parse(req.body);
    const updated = await adminService.updateReportStatus(req.params.id, body.status);
    await adminService.logAction(req.adminId!, 'report.update', 'Report', req.params.id, body);
    res.json(updated);
  }),
);
