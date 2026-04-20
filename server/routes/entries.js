import express from "express";
import Entry from "../models/Entry.js";
import Settings from "../models/Settings.js";
import { estimateCalories } from "../anthropic.js";

const router = express.Router();

const ALLOWED = ["walk", "squash", "taekwondo", "strength", "protein"];

router.get("/", async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: "start and end required" });
  const entries = await Entry.find({ date: { $gte: start, $lte: end } }).sort({ date: 1 });
  res.json(entries);
});

router.put("/:date/:activity", async (req, res) => {
  const { date, activity } = req.params;
  if (!ALLOWED.includes(activity)) return res.status(400).json({ error: "bad activity" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: "bad date" });

  const body = req.body || {};
  const update = { date, activity };

  const normNum = (v) => (v === "" || v == null ? null : Number(v));
  if ("done" in body) update.done = !!body.done;
  if ("distanceKm" in body) update.distanceKm = normNum(body.distanceKm);
  if ("durationMin" in body) update.durationMin = normNum(body.durationMin);
  if ("rpe" in body) update.rpe = normNum(body.rpe);
  if ("proteinG" in body) update.proteinG = normNum(body.proteinG);
  if ("notes" in body) update.notes = body.notes || "";

  let entry = await Entry.findOneAndUpdate(
    { date, activity },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  if (
    activity !== "protein" &&
    entry.done &&
    entry.durationMin &&
    entry.durationMin > 0
  ) {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    const cals = await estimateCalories({
      activity,
      durationMin: entry.durationMin,
      rpe: entry.rpe,
      bodyWeightKg: settings.bodyWeightKg,
    });
    entry.caloriesBurned = cals;
    await entry.save();
  } else if (!entry.done || !entry.durationMin) {
    if (entry.caloriesBurned != null) {
      entry.caloriesBurned = null;
      await entry.save();
    }
  }

  res.json(entry);
});

router.delete("/:date/:activity", async (req, res) => {
  const { date, activity } = req.params;
  await Entry.deleteOne({ date, activity });
  res.json({ ok: true });
});

export default router;
