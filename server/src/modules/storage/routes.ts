import { Router } from 'express';
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
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new HttpError(400, 'INVALID_FILE_TYPE', 'Only image uploads are supported'));
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
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'NO_FILE', 'No file uploaded (expected field "file")');
    res.status(201).json({ url: `${env.publicBaseUrl}/uploads/${req.file.filename}` });
  }),
);
