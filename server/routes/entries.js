import express from "express";
import Entry from "../models/Entry.js";
import Tracker from "../models/Tracker.js";
import User from "../models/User.js";
import { estimateCalories } from "../anthropic.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: "start and end required" });
  const list = await Entry.find({
    userId: req.userId,
    date: { $gte: start, $lte: end },
  }).sort({ date: 1, createdAt: 1 });
  res.json(list);
});

router.post("/", async (req, res) => {
  const body = req.body || {};
  if (!body.trackerId) return res.status(400).json({ error: "trackerId required" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date || "")) return res.status(400).json({ error: "bad date" });

  const tracker = await Tracker.findOne({ _id: body.trackerId, userId: req.userId });
  if (!tracker) return res.status(404).json({ error: "tracker not found" });

  const entry = await Entry.create({
    userId: req.userId,
    trackerId: tracker._id,
    date: body.date,
    durationMin: num(body.durationMin),
    distanceKm: num(body.distanceKm),
    rpe: num(body.rpe),
    amount: num(body.amount),
    notes: (body.notes || "").toString().slice(0, 1000),
  });

  if (tracker.kind === "workout" && entry.durationMin && entry.durationMin > 0) {
    const user = await User.findById(req.userId).lean();
    const result = await estimateCalories({
      activityName: tracker.name,
      durationMin: entry.durationMin,
      rpe: entry.rpe,
      bodyWeightKg: user?.demographics?.weightKg,
      heightCm: user?.demographics?.heightCm,
      sex: user?.demographics?.sex,
      age: user?.demographics?.age,
      fitnessLevel: user?.demographics?.fitnessLevel,
    });
    entry.caloriesBurned = result.calories;
    entry.caloriesBurnedSource = result.source;
    await entry.save();
  }

  res.status(201).json(entry);
});

router.put("/:id", async (req, res) => {
  const entry = await Entry.findOne({ _id: req.params.id, userId: req.userId });
  if (!entry) return res.status(404).json({ error: "not found" });
  const tracker = await Tracker.findOne({ _id: entry.trackerId, userId: req.userId });
  if (!tracker) return res.status(404).json({ error: "tracker not found" });

  const body = req.body || {};
  let needsRecalc = false;
  if ("durationMin" in body) { entry.durationMin = num(body.durationMin); needsRecalc = true; }
  if ("distanceKm" in body) { entry.distanceKm = num(body.distanceKm); }
  if ("rpe" in body) { entry.rpe = num(body.rpe); needsRecalc = true; }
  if ("amount" in body) { entry.amount = num(body.amount); }
  if ("notes" in body) entry.notes = (body.notes || "").toString().slice(0, 1000);

  // Manual override of calories
  if ("caloriesBurned" in body) {
    if (body.caloriesBurned == null || body.caloriesBurned === "") {
      entry.caloriesBurned = null;
      entry.caloriesBurnedSource = null;
    } else {
      entry.caloriesBurned = num(body.caloriesBurned);
      entry.caloriesBurnedSource = "manual";
    }
    needsRecalc = false;
  } else if (needsRecalc && tracker.kind === "workout" && entry.durationMin && entry.durationMin > 0
             && entry.caloriesBurnedSource !== "manual") {
    const user = await User.findById(req.userId).lean();
    const result = await estimateCalories({
      activityName: tracker.name,
      durationMin: entry.durationMin,
      rpe: entry.rpe,
      bodyWeightKg: user?.demographics?.weightKg,
      heightCm: user?.demographics?.heightCm,
      sex: user?.demographics?.sex,
      age: user?.demographics?.age,
      fitnessLevel: user?.demographics?.fitnessLevel,
    });
    entry.caloriesBurned = result.calories;
    entry.caloriesBurnedSource = result.source;
  }

  await entry.save();
  res.json(entry);
});

router.delete("/:id", async (req, res) => {
  await Entry.deleteOne({ _id: req.params.id, userId: req.userId });
  res.json({ ok: true });
});

function num(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default router;
