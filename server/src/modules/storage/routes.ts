import { Router, RequestHandler } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { requireAuth } from '../../middleware/auth';
import { HttpError, asyncHandler } from '../../middleware/errorHandler';
import { env } from '../../config/env';

const uploadDir = path.resolve(env.uploadDir);
fs.mkdirSync(uploadDir, { recursive: true });

// Local disk storage for a first version — swap this Multer storage engine
// for an S3/Azure one later without touching the route or the mobile client,
// since both return the same `{ url }` shape.
// The extension comes from this allowlist, never the client's filename: uploads are served from this origin, so
// "x.html" labelled image/png must not come back as HTML. SVG is excluded because it can carry script.
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'image/heif': '.heif',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${randomUUID()}${EXTENSIONS[file.mimetype]}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!EXTENSIONS[file.mimetype]) {
      return cb(new HttpError(400, 'INVALID_FILE_TYPE', 'Only JPEG, PNG, WebP, GIF or HEIC images are supported'));
    }
    cb(null, true);
  },
});

export const storageRouter = Router();
storageRouter.use(requireAuth);

/**
 * @openapi
 * /storage/upload:
 *   post:
 *     summary: Upload an image (multipart field "file").
 *     tags: [Storage]
 */
storageRouter.post(
  '/upload',
  upload.single('file') as unknown as RequestHandler,
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'NO_FILE', 'No file uploaded (expected field "file")');
    res.status(201).json({ url: `${env.publicBaseUrl}/uploads/${req.file.filename}` });
  }),
);
