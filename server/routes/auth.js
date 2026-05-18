import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Entry from "../models/Entry.js";
import Tracker from "../models/Tracker.js";
import Conversation from "../models/Conversation.js";
import NutritionEntry from "../models/NutritionEntry.js";
import MealTemplate from "../models/MealTemplate.js";
import { issueSession, clearSession, requireAuth } from "../auth.js";

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PW_MIN = 8;

router.post("/signup", async (req, res) => {
  const email = (req.body?.email || "").trim().toLowerCase();
  const password = req.body?.password || "";
  const displayName = (req.body?.displayName || "").trim().slice(0, 80);

  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "invalid email" });
  if (password.length < PW_MIN)
    return res.status(400).json({ error: `password must be at least ${PW_MIN} characters` });

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: "email already in use" });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash, displayName });
  issueSession(res, user._id.toString());
  res.status(201).json({ user: user.toSafe() });
});

router.post("/login", async (req, res) => {
  const email = (req.body?.email || "").trim().toLowerCase();
  const password = req.body?.password || "";
  if (!email || !password) return res.status(400).json({ error: "missing credentials" });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "invalid credentials" });

  issueSession(res, user._id.toString());
  res.json({ user: user.toSafe() });
});

router.post("/logout", (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  res.json({ user: user.toSafe() });
});

const MACRO_KEYS = ["kcal", "proteinG", "carbsG", "fatG"];

router.put("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  const { displayName, demographics, onboardedAt, targets } = req.body || {};

  if (typeof displayName === "string") user.displayName = displayName.trim().slice(0, 80);

  if (demographics && typeof demographics === "object") {
    const d = user.demographics || {};
    if ("sex" in demographics) d.sex = demographics.sex || null;
    if ("age" in demographics) d.age = numOrNull(demographics.age);
    if ("heightCm" in demographics) d.heightCm = numOrNull(demographics.heightCm);
    if ("weightKg" in demographics) d.weightKg = numOrNull(demographics.weightKg);
    if ("fitnessLevel" in demographics) d.fitnessLevel = demographics.fitnessLevel || null;
    user.demographics = d;
  }

  if (targets && typeof targets === "object") {
    const cur = user.targets?.toObject ? user.targets.toObject() : { ...(user.targets || {}) };
    for (const k of MACRO_KEYS) {
      if (k in targets) cur[k] = numOrNull(targets[k]);
    }
    // Drop legacy nested shape if present on the doc.
    delete cur.trainingDay;
    delete cur.restDay;
    user.targets = cur;
  }

  if (onboardedAt === true && !user.onboardedAt) user.onboardedAt = new Date();
  await user.save();
  res.json({ user: user.toSafe() });
});

router.get("/me/export", requireAuth, async (req, res) => {
  const userId = req.userId;
  const user = await User.findById(userId);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  const [trackers, entries, conversation, nutrition, templates] = await Promise.all([
    Tracker.find({ userId }).lean(),
    Entry.find({ userId }).lean(),
    Conversation.findOne({ userId }).lean(),
    NutritionEntry.find({ userId }).lean(),
    MealTemplate.find({ userId }).lean(),
  ]);
  res.setHeader("Content-Disposition", `attachment; filename=log-export-${userId}.json`);
  res.setHeader("Content-Type", "application/json");
  res.send(
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        user: user.toSafe(),
        trackers,
        entries,
        nutrition,
        templates,
        conversation: conversation ? { messages: conversation.messages } : null,
      },
      null,
      2
    )
  );
});

router.delete("/me", requireAuth, async (req, res) => {
  const userId = req.userId;
  await Promise.all([
    Entry.deleteMany({ userId }),
    Tracker.deleteMany({ userId }),
    Conversation.deleteMany({ userId }),
    NutritionEntry.deleteMany({ userId }),
    MealTemplate.deleteMany({ userId }),
    User.deleteOne({ _id: userId }),
  ]);
  clearSession(res);
  res.json({ ok: true });
});

function numOrNull(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default router;
