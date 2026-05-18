// Admin-only endpoints. Gated by ADMIN_EMAIL env var matching the
// authenticated user. If ADMIN_EMAIL is unset, every request is denied.

import express from "express";
import User from "../models/User.js";
import { cacheClear, cacheSize } from "../lib/aiCache.js";

const router = express.Router();

async function requireAdmin(req, res, next) {
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!adminEmail) return res.status(403).json({ error: "admin not configured" });
  const user = await User.findById(req.userId).lean();
  if (!user || user.email !== adminEmail) {
    return res.status(403).json({ error: "forbidden" });
  }
  next();
}

router.get("/cache", requireAdmin, (req, res) => {
  res.json({ size: cacheSize() });
});

router.delete("/cache", requireAdmin, (req, res) => {
  const cleared = cacheClear();
  res.json({ ok: true, cleared });
});

export default router;
