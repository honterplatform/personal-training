import express from "express";
import Conversation from "../models/Conversation.js";
import Tracker from "../models/Tracker.js";
import Entry from "../models/Entry.js";
import User from "../models/User.js";
import { coachChat, coachOpener } from "../anthropic.js";
import { weekRange, weekStartISO, todayISO } from "../dates.js";

const router = express.Router();
const HISTORY_TURNS = 16;

async function loadConversation(userId) {
  let c = await Conversation.findOne({ userId });
  if (!c) c = await Conversation.create({ userId, messages: [] });
  return c;
}

async function buildContext(userId, dateInput) {
  const ref = dateInput && /^\d{4}-\d{2}-\d{2}$/.test(dateInput) ? dateInput : todayISO();
  const weekStart = weekStartISO(ref);
  const { start, end } = weekRange(ref);
  const [user, trackers, weekEntries, dayEntries] = await Promise.all([
    User.findById(userId).lean(),
    Tracker.find({ userId, archivedAt: null }).sort({ pinned: -1, order: 1 }).lean(),
    Entry.find({ userId, date: { $gte: start, $lte: end } }).lean(),
    Entry.find({ userId, date: ref }).lean(),
  ]);
  return { user, trackers, weekEntries, dayEntries, weekStart, selectedDate: ref };
}

router.get("/", async (req, res) => {
  const c = await loadConversation(req.userId);
  res.json({ messages: c.messages });
});

router.post("/", async (req, res) => {
  const { message, date } = req.body || {};
  if (!message || typeof message !== "string" || !message.trim())
    return res.status(400).json({ error: "message required" });

  const c = await loadConversation(req.userId);
  const ctx = await buildContext(req.userId, date);
  const reply = await coachChat({
    history: c.messages.slice(-HISTORY_TURNS),
    userMessage: message.trim(),
    contextArgs: ctx,
  });
  c.messages.push({ role: "user", content: message.trim(), createdAt: new Date() });
  c.messages.push({ role: "assistant", content: reply, createdAt: new Date() });
  await c.save();
  res.json({ messages: c.messages });
});

router.post("/opener", async (req, res) => {
  const { date } = req.body || {};
  const c = await loadConversation(req.userId);
  const ctx = await buildContext(req.userId, date);
  const reply = await coachOpener({ contextArgs: ctx });
  c.messages.push({ role: "assistant", content: reply, createdAt: new Date() });
  await c.save();
  res.json({ messages: c.messages });
});

router.delete("/", async (req, res) => {
  await Conversation.findOneAndUpdate(
    { userId: req.userId },
    { $set: { messages: [] } },
    { upsert: true }
  );
  res.json({ messages: [] });
});

export default router;
