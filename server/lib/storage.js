// Photo storage layer. Currently backed by the local filesystem (a
// Railway-mounted volume in production, the project's own .local dir
// in dev). The interface is small enough that swapping to S3/R2 later
// is a drop-in replacement of these four functions.
//
// In production, set PHOTO_DIR=/data/photos and mount the volume to
// /data via Railway → Service → Settings → Volumes.

import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";

const PHOTO_DIR = process.env.PHOTO_DIR
  || path.join(process.cwd(), ".local", "photos");

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

/**
 * Write a buffer to `<userId>/<photoId>.jpg`. Returns the imageKey
 * suitable for storing on the ProgressPhoto document.
 */
export async function putPhoto({ userId, photoId, buffer }) {
  const userDir = path.join(PHOTO_DIR, String(userId));
  await ensureDir(userDir);
  const file = path.join(userDir, `${photoId}.jpg`);
  await fs.writeFile(file, buffer);
  return `${userId}/${photoId}.jpg`;
}

export function streamPhoto(imageKey) {
  return createReadStream(path.join(PHOTO_DIR, imageKey));
}

export async function deletePhoto(imageKey) {
  try {
    await fs.unlink(path.join(PHOTO_DIR, imageKey));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
}

export async function deleteUserPhotos(userId) {
  const userDir = path.join(PHOTO_DIR, String(userId));
  try { await fs.rm(userDir, { recursive: true, force: true }); }
  catch (err) { if (err.code !== "ENOENT") throw err; }
}

export { PHOTO_DIR };
