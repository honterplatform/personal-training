import express from "express";
import Summary from "../models/Summary.js";
import Entry from "../models/Entry.js";
import Settings from "../models/Settings.js";
import { weeklySummary } from "../anthropic.js";
import { weekRange } from "../dates.js";

const router = express.Router();

router.get("/:weekStart", async (req, res) => {
  const { weekStart } = req.params;
  const existing = await Summary.findOne({ weekStart });
  if (!existing) return res.json({ text: null });
  res.json(existing);
});

router.post("/:weekStart", async (req, res) => {
  const { weekStart } = req.params;
  const { end } = weekRange(weekStart);
  const entries = await Entry.find({ date: { $gte: weekStart, $lte: end } }).sort({ date: 1 });
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  const text = await weeklySummary({ entries, settings, weekStart });
  const saved = await Summary.findOneAndUpdate(
    { weekStart },
    { $set: { text, generatedAt: new Date() } },
    { new: true, upsert: true }
  );
  res.json(saved);
});

export default router;
