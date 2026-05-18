import express from "express";
import NutritionEntry, { MEAL_SLOTS } from "../models/NutritionEntry.js";
import { estimateMeal } from "../anthropic.js";
import { cacheGet, cacheSet } from "../lib/aiCache.js";
import { consumeQuota, sendQuotaErrorIfAny } from "../lib/aiQuota.js";
import { insightsInvalidate } from "../lib/insightsCache.js";

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
  const source = ["manual", "ai", "fallback"].includes(body.source) ? body.source : "manual";
  const confidence = ["high","med","low"].includes(body.confidence) ? body.confidence : null;

  const entry = await NutritionEntry.create({
    userId:     req.userId,
    date:       body.date,
    mealSlot:   body.mealSlot,
    calories:   nonNegNum(body.calories),
    proteinG:   nonNegNum(body.proteinG),
    carbsG:     nonNegNum(body.carbsG),
    fatG:       nonNegNum(body.fatG),
    notes:      (body.notes || "").toString().slice(0, 1000),
    source,
    confidence,
    sourceText: (body.sourceText || "").toString().slice(0, 1000),
  });
  insightsInvalidate(req.userId);
  res.status(201).json(entry);
});

/**
 * POST /api/nutrition/estimate
 * Body: { text, mealSlot, date? }
 * Returns: { calories, proteinG, carbsG, fatG, confidence, source, cached }
 *   source = "ai" | "fallback"
 *   cached = true if the result came from the in-memory cache (no quota
 *            consumed, no API call made)
 *
 * Cache key = sha1(normalize(text)|mealSlot). 30-day TTL.
 * Quota:   consumed only on cache miss + API success path.
 */
router.post("/estimate", async (req, res) => {
  const body = req.body || {};
  const text = (body.text || "").toString().trim();
  if (!text) return res.status(400).json({ error: "text required" });
  if (!MEAL_SLOTS.includes(body.mealSlot)) {
    return res.status(400).json({ error: `mealSlot must be one of ${MEAL_SLOTS.join(", ")}` });
  }

  // 1. Cache hit short-circuits everything.
  const cached = cacheGet({ text, mealSlot: body.mealSlot });
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  // 2. Try to consume estimate quota. If exhausted, return 429 — do NOT
  //    silently fall back to the keyword parser here, since the user
  //    explicitly wants a clear error.
  try { await consumeQuota(req.userId, "estimate"); }
  catch (err) { if (sendQuotaErrorIfAny(err, res)) return; throw err; }

  // 3. Call the AI (or its built-in MET-style fallback). The fallback
  //    branch sets source: "fallback" so the UI can flag it.
  const result = await estimateMeal({ text, mealSlot: body.mealSlot });

  // 4. Cache only AI successes — fallback results are cheap to recompute
  //    and might be wrong, so we'd rather re-evaluate them next time.
  if (result.source === "ai") {
    cacheSet({ text, mealSlot: body.mealSlot }, result);
  }

  res.json({ ...result, cached: false });
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

  // Manual edits flip source to "manual" so we don't claim AI-confidence
  // on a number the user has overridden.
  if ("calories" in body || "proteinG" in body || "carbsG" in body || "fatG" in body) {
    entry.source = "manual";
    entry.confidence = null;
  }

  await entry.save();
  insightsInvalidate(req.userId);
  res.json(entry);
});

router.delete("/:id", async (req, res) => {
  await NutritionEntry.deleteOne({ _id: req.params.id, userId: req.userId });
  insightsInvalidate(req.userId);
  res.json({ ok: true });
});

function nonNegNum(v) {
  if (v === "" || v == null) return 0;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

export default router;
