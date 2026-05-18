// /api/photos
// Upload (multipart), list, signed-URL stream, delete.
// Images are private to the owning user. The stream endpoint is gated
// by a short-lived JWT signed with COOKIE_SECRET so links can't be
// shared outside the session.

import express from "express";
import multer from "multer";
import sharp from "sharp";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import ProgressPhoto, { ANGLES } from "../models/ProgressPhoto.js";
import { putPhoto, streamPhoto, deletePhoto } from "../lib/storage.js";
import { requireAuth } from "../auth.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB before resize
});

const TOKEN_TTL_S = 10 * 60;

router.get("/", requireAuth, async (req, res) => {
  const { start, end } = req.query;
  const filter = { userId: req.userId };
  if (start && end) filter.date = { $gte: start, $lte: end };
  const list = await ProgressPhoto.find(filter)
    .sort({ date: 1, angle: 1, createdAt: 1 })
    .lean();
  // Attach a fresh signed URL token to each photo so the client can render.
  const withTokens = list.map((p) => ({
    ...p,
    url: signedUrlFor(p._id, req.userId),
  }));
  res.json(withTokens);
});

router.post("/", requireAuth, upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "image file required" });
  const date = req.body.date;
  const angle = req.body.angle;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "date required (YYYY-MM-DD)" });
  }
  if (!ANGLES.includes(angle)) {
    return res.status(400).json({ error: `angle must be one of ${ANGLES.join(", ")}` });
  }

  // EXIF strip + downscale to max 1920px + re-encode JPEG q=85
  const processed = await sharp(req.file.buffer)
    .rotate()                     // honor EXIF orientation before stripping
    .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .withMetadata({ exif: {} })   // strip EXIF
    .toBuffer({ resolveWithObject: true });

  const photoId = new mongoose.Types.ObjectId();
  const imageKey = await putPhoto({
    userId: req.userId,
    photoId,
    buffer: processed.data,
  });

  const doc = await ProgressPhoto.create({
    _id:        photoId,
    userId:     req.userId,
    date,
    angle,
    imageKey,
    contentType: "image/jpeg",
    bytes:       processed.info.size,
    width:       processed.info.width,
    height:      processed.info.height,
    notes:       (req.body.notes || "").toString().slice(0, 300),
  });

  res.status(201).json({ ...doc.toObject(), url: signedUrlFor(doc._id, req.userId) });
});

// Stream endpoint — JWT-gated, no cookie required (so <img src> works).
router.get("/:id/file", async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).end();
  let payload;
  try {
    payload = jwt.verify(token, process.env.COOKIE_SECRET);
  } catch {
    return res.status(401).end();
  }
  if (String(payload.id) !== String(req.params.id)) return res.status(401).end();

  const doc = await ProgressPhoto.findOne({ _id: payload.id, userId: payload.uid });
  if (!doc) return res.status(404).end();

  res.setHeader("Content-Type", doc.contentType || "image/jpeg");
  res.setHeader("Cache-Control", "private, max-age=600");
  streamPhoto(doc.imageKey).pipe(res);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const doc = await ProgressPhoto.findOne({ _id: req.params.id, userId: req.userId });
  if (!doc) return res.status(404).json({ error: "not found" });
  await deletePhoto(doc.imageKey);
  await doc.deleteOne();
  res.json({ ok: true });
});

function signedUrlFor(photoId, userId) {
  const token = jwt.sign(
    { id: String(photoId), uid: String(userId) },
    process.env.COOKIE_SECRET,
    { expiresIn: TOKEN_TTL_S }
  );
  return `/api/photos/${photoId}/file?token=${token}`;
}

export default router;
