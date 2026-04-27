import express from "express";
import Conversation from "../models/Conversation.js";
import Entry from "../models/Entry.js";
import Settings from "../models/Settings.js";
import { coachChat, coachOpener } from "../anthropic.js";
import { weekRange, weekStartISO, todayISO } from "../dates.js";

const router = express.Router();

const HISTORY_TURNS = 16;

async function loadConversation() {
  let c = await Conversation.findOne({ key: "default" });
  if (!c) c = await Conversation.create({ key: "default", messages: [] });
  return c;
}

async function buildContextArgs(date) {
  const ref = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayISO();
  const weekStart = weekStartISO(ref);
  const { start, end } = weekRange(ref);
  const [settings, weekEntries, dayEntries] = await Promise.all([
    Settings.findOne(),
    Entry.find({ date: { $gte: start, $lte: end } }).sort({ date: 1 }),
    Entry.find({ date: ref }),
  ]);
  return {
    settings,
    weekEntries: weekEntries.map((e) => e.toObject()),
    dayEntries: dayEntries.map((e) => e.toObject()),
    weekStart,
    selectedDate: ref,
  };
}

router.get("/", async (req, res) => {
  const c = await loadConversation();
  res.json({ messages: c.messages });
});

router.post("/", async (req, res) => {
  const { message, date } = req.body || {};
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "message required" });
  }
  const c = await loadConversation();
  const contextArgs = await buildContextArgs(date);

  const recentHistory = c.messages.slice(-HISTORY_TURNS);
  const reply = await coachChat({
    history: recentHistory,
    userMessage: message.trim(),
    contextArgs,
  });

  c.messages.push({ role: "user", content: message.trim(), createdAt: new Date() });
  c.messages.push({ role: "assistant", content: reply, createdAt: new Date() });
  await c.save();

  res.json({ messages: c.messages });
});

router.post("/opener", async (req, res) => {
  const { date } = req.body || {};
  const c = await loadConversation();
  const contextArgs = await buildContextArgs(date);
  const reply = await coachOpener({ contextArgs });
  c.messages.push({ role: "assistant", content: reply, createdAt: new Date() });
  await c.save();
  res.json({ messages: c.messages });
});

router.delete("/", async (req, res) => {
  await Conversation.findOneAndUpdate(
    { key: "default" },
    { $set: { messages: [] } },
    { upsert: true }
  );
  res.json({ messages: [] });
});

export default router;
