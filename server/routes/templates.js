import express from "express";
import MealTemplate from "../models/MealTemplate.js";
import { MEAL_SLOTS } from "../models/NutritionEntry.js";

const router = express.Router();

const MAX_PINNED = 12;

router.get("/", async (req, res) => {
  const list = await MealTemplate.find({ userId: req.userId })
    .sort({ pinned: -1, order: 1, createdAt: 1 });
  res.json(list);
});

router.post("/", async (req, res) => {
  const body = req.body || {};
  if (!body.name || typeof body.name !== "string") {
    return res.status(400).json({ error: "name required" });
  }
  if (!MEAL_SLOTS.includes(body.mealSlot)) {
    return res.status(400).json({ error: `mealSlot must be one of ${MEAL_SLOTS.join(", ")}` });
  }

  // Cap pinned templates at MAX_PINNED. If we're at the cap and the new
  // one is pinned, unpin the oldest to make room.
  const pinned = body.pinned !== false;
  if (pinned) {
    const pinnedCount = await MealTemplate.countDocuments({ userId: req.userId, pinned: true });
    if (pinnedCount >= MAX_PINNED) {
      const oldest = await MealTemplate.findOne({ userId: req.userId, pinned: true }).sort({ order: 1, createdAt: 1 });
      if (oldest) { oldest.pinned = false; await oldest.save(); }
    }
  }

  const last = await MealTemplate.findOne({ userId: req.userId }).sort({ order: -1 }).select("order");
  const order = (last?.order ?? -1) + 1;

  const t = await MealTemplate.create({
    userId:     req.userId,
    name:       body.name.trim().slice(0, 80),
    mealSlot:   body.mealSlot,
    calories:   nonNeg(body.calories),
    proteinG:   nonNeg(body.proteinG),
    carbsG:     nonNeg(body.carbsG),
    fatG:       nonNeg(body.fatG),
    sourceText: (body.sourceText || "").toString().slice(0, 1000),
    pinned,
    order,
  });
  res.status(201).json(t);
});

router.put("/:id", async (req, res) => {
  const t = await MealTemplate.findOne({ _id: req.params.id, userId: req.userId });
  if (!t) return res.status(404).json({ error: "not found" });
  const body = req.body || {};

  if (typeof body.name === "string") t.name = body.name.trim().slice(0, 80);
  if (body.mealSlot && MEAL_SLOTS.includes(body.mealSlot)) t.mealSlot = body.mealSlot;
  if ("calories" in body) t.calories = nonNeg(body.calories);
  if ("proteinG" in body) t.proteinG = nonNeg(body.proteinG);
  if ("carbsG"   in body) t.carbsG   = nonNeg(body.carbsG);
  if ("fatG"     in body) t.fatG     = nonNeg(body.fatG);
  if ("sourceText" in body) t.sourceText = (body.sourceText || "").toString().slice(0, 1000);
  if ("pinned" in body) t.pinned = !!body.pinned;
  if ("order"  in body && Number.isFinite(Number(body.order))) t.order = Number(body.order);
  await t.save();
  res.json(t);
});

router.delete("/:id", async (req, res) => {
  await MealTemplate.deleteOne({ _id: req.params.id, userId: req.userId });
  res.json({ ok: true });
});

router.put("/order", async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  await Promise.all(
    items.map((it, i) =>
      MealTemplate.updateOne(
        { _id: it.id, userId: req.userId },
        { $set: { order: i, pinned: it.pinned !== false } }
      )
    )
  );
  res.json({ ok: true });
});

function nonNeg(v) {
  if (v === "" || v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export default router;
