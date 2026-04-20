import express from "express";
import { issueCookie } from "../auth.js";

const router = express.Router();

router.post("/", (req, res) => {
  const expected = process.env.APP_PASSWORD;
  const { password } = req.body || {};
  if (!expected) return res.status(500).json({ error: "APP_PASSWORD not configured" });
  if (!password || password !== expected) {
    return res.status(401).json({ error: "invalid password" });
  }
  issueCookie(res);
  res.json({ ok: true });
});

export default router;
