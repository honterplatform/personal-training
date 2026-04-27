import express from "express";
import User from "../models/User.js";
import Entry from "../models/Entry.js";
import Tracker from "../models/Tracker.js";
import Conversation from "../models/Conversation.js";
import { requireAuth, clerk } from "../auth.js";

const router = express.Router();

router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.user.toSafe() });
});

router.put("/me", requireAuth, async (req, res) => {
  const { displayName, demographics, onboardedAt } = req.body || {};
  const user = req.user;

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
  if (onboardedAt === true && !user.onboardedAt) user.onboardedAt = new Date();
  await user.save();
  res.json({ user: user.toSafe() });
});

router.get("/me/export", requireAuth, async (req, res) => {
  const userId = req.userId;
  const [trackers, entries, conversation] = await Promise.all([
    Tracker.find({ userId }).lean(),
    Entry.find({ userId }).lean(),
    Conversation.findOne({ userId }).lean(),
  ]);
  res.setHeader("Content-Disposition", `attachment; filename=log-export-${userId}.json`);
  res.setHeader("Content-Type", "application/json");
  res.send(
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        user: req.user.toSafe(),
        trackers,
        entries,
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
    User.deleteOne({ _id: userId }),
  ]);
  // Also delete the Clerk user so they can sign up again with the same email
  try {
    await clerk().users.deleteUser(userId);
  } catch (err) {
    console.warn("[clerk] delete user failed:", err.message);
  }
  res.json({ ok: true });
});

function numOrNull(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default router;
