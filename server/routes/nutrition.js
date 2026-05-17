import express from "express";
import NutritionEntry, { MEAL_SLOTS } from "../models/NutritionEntry.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: "start and end required" });
  const list = await NutritionEntry.find({
    userId: req.userId,
    date: { $gte: start, $lte: end },
  }).sort({ date: 1, createdAt: 1 });
  res.json(list);
});

router.post("/", async (req, res) => {
  const body = req.body || {};
  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return res.status(400).json({ error: "date required (YYYY-MM-DD)" });
  }
  if (!MEAL_SLOTS.includes(body.mealSlot)) {
    return res.status(400).json({ error: `mealSlot must be one of ${MEAL_SLOTS.join(", ")}` });
  }
  const entry = await NutritionEntry.create({
    userId:   req.userId,
    date:     body.date,
    mealSlot: body.mealSlot,
    calories: nonNegNum(body.calories),
    proteinG: nonNegNum(body.proteinG),
    carbsG:   nonNegNum(body.carbsG),
    fatG:     nonNegNum(body.fatG),
    notes:    (body.notes || "").toString().slice(0, 1000),
    source:   "manual",
  });
  res.status(201).json(entry);
});

router.put("/:id", async (req, res) => {
  const entry = await NutritionEntry.findOne({ _id: req.params.id, userId: req.userId });
  if (!entry) return res.status(404).json({ error: "not found" });

  const body = req.body || {};
  if ("mealSlot" in body) {
    if (!MEAL_SLOTS.includes(body.mealSlot)) {
      return res.status(400).json({ error: "invalid mealSlot" });
    }
    entry.mealSlot = body.mealSlot;
  }
  if ("calories" in body) entry.calories = nonNegNum(body.calories);
  if ("proteinG" in body) entry.proteinG = nonNegNum(body.proteinG);
  if ("carbsG"   in body) entry.carbsG   = nonNegNum(body.carbsG);
  if ("fatG"     in body) entry.fatG     = nonNegNum(body.fatG);
  if ("notes"    in body) entry.notes    = (body.notes || "").toString().slice(0, 1000);

  await entry.save();
  res.json(entry);
});

router.delete("/:id", async (req, res) => {
  await NutritionEntry.deleteOne({ _id: req.params.id, userId: req.userId });
  res.json({ ok: true });
});

function nonNegNum(v) {
  if (v === "" || v == null) return 0;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

export default router;
