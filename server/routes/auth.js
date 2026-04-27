import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Entry from "../models/Entry.js";
import Tracker from "../models/Tracker.js";
import Conversation from "../models/Conversation.js";
import { issueSession, clearSession, requireAuth } from "../auth.js";
import { verifyAppleIdToken, verifyGoogleIdToken } from "../oauth.js";

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PW_MIN = 8;

router.post("/signup", async (req, res) => {
  const email = (req.body?.email || "").trim().toLowerCase();
  const password = req.body?.password || "";
  const displayName = (req.body?.displayName || "").trim();

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
  if (!user || !user.passwordHash) return res.status(401).json({ error: "invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "invalid credentials" });

  issueSession(res, user._id.toString());
  res.json({ user: user.toSafe() });
});

router.post("/logout", (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

// Apple Sign In — the iOS client sends the identityToken from the native flow.
router.post("/apple", async (req, res) => {
  const { identityToken, fullName } = req.body || {};
  if (!identityToken) return res.status(400).json({ error: "identityToken required" });
  const audience = process.env.IOS_BUNDLE_ID || "com.honterplatform.log";
  let payload;
  try {
    payload = await verifyAppleIdToken(identityToken, audience);
  } catch (err) {
    console.error("[apple] verify failed:", err.message);
    return res.status(401).json({ error: "invalid apple token" });
  }
  if (!payload.sub) return res.status(401).json({ error: "no apple sub" });

  let user = await User.findOne({ appleSub: payload.sub });
  if (!user && payload.email) user = await User.findOne({ email: payload.email.toLowerCase() });
  if (!user) {
    if (!payload.email) return res.status(400).json({ error: "apple did not return email" });
    user = await User.create({
      email: payload.email.toLowerCase(),
      passwordHash: null,
      appleSub: payload.sub,
      displayName: (fullName || "").toString().trim().slice(0, 80),
    });
  } else if (!user.appleSub) {
    user.appleSub = payload.sub;
    if (fullName && !user.displayName) user.displayName = fullName.toString().trim().slice(0, 80);
    await user.save();
  }

  issueSession(res, user._id.toString());
  res.json({ user: user.toSafe() });
});

// Google Sign In — iOS client passes idToken from the native Google SDK.
router.post("/google", async (req, res) => {
  const { idToken } = req.body || {};
  if (!idToken) return res.status(400).json({ error: "idToken required" });

  const accepted = (process.env.GOOGLE_CLIENT_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (accepted.length === 0) return res.status(500).json({ error: "GOOGLE_CLIENT_IDS not configured" });

  let payload;
  try {
    payload = await verifyGoogleIdToken(idToken, accepted);
  } catch (err) {
    console.error("[google] verify failed:", err.message);
    return res.status(401).json({ error: "invalid google token" });
  }
  if (!payload.sub || !payload.email) return res.status(401).json({ error: "google missing fields" });

  let user = await User.findOne({ googleSub: payload.sub });
  if (!user) user = await User.findOne({ email: payload.email.toLowerCase() });
  if (!user) {
    user = await User.create({
      email: payload.email.toLowerCase(),
      passwordHash: null,
      googleSub: payload.sub,
      displayName: payload.name?.slice(0, 80) || "",
    });
  } else if (!user.googleSub) {
    user.googleSub = payload.sub;
    if (payload.name && !user.displayName) user.displayName = payload.name.slice(0, 80);
    await user.save();
  }

  issueSession(res, user._id.toString());
  res.json({ user: user.toSafe() });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  res.json({ user: user.toSafe() });
});

router.put("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  const { displayName, demographics, onboardedAt } = req.body || {};
  if (typeof displayName === "string") user.displayName = displayName.trim().slice(0, 80);
  if (demographics && typeof demographics === "object") {
    const d = user.demographics || {};
    if ("sex" in demographics) d.sex = demographics.sex || null;
    if ("age" in demographics) d.age = demographics.age == null || demographics.age === "" ? null : Number(demographics.age);
    if ("heightCm" in demographics) d.heightCm = demographics.heightCm == null || demographics.heightCm === "" ? null : Number(demographics.heightCm);
    if ("weightKg" in demographics) d.weightKg = demographics.weightKg == null || demographics.weightKg === "" ? null : Number(demographics.weightKg);
    if ("fitnessLevel" in demographics) d.fitnessLevel = demographics.fitnessLevel || null;
    user.demographics = d;
  }
  if (onboardedAt === true && !user.onboardedAt) user.onboardedAt = new Date();
  await user.save();
  res.json({ user: user.toSafe() });
});

router.get("/me/export", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  const [trackers, entries, conversation] = await Promise.all([
    Tracker.find({ userId: user._id }).lean(),
    Entry.find({ userId: user._id }).lean(),
    Conversation.findOne({ userId: user._id }).lean(),
  ]);
  res.setHeader("Content-Disposition", `attachment; filename=log-export-${user._id}.json`);
  res.setHeader("Content-Type", "application/json");
  res.send(
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        user: user.toSafe(),
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
  clearSession(res);
  res.json({ ok: true });
});

export default router;
