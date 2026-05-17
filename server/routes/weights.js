import express from "express";
import Weight from "../models/Weight.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: "start and end required" });
  const list = await Weight.find({
    userId: req.userId,
    date: { $gte: start, $lte: end },
  }).sort({ date: 1 });
  res.json(list);
});

router.post("/", async (req, res) => {
  const body = req.body || {};
  const date = body.date;
  const weightKg = num(body.weightKg);

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "date required (YYYY-MM-DD)" });
  }
  if (weightKg == null || weightKg <= 0) {
    return res.status(400).json({ error: "weightKg required" });
  }

  // Upsert by (userId, date) — re-logging the same day replaces the value.
  const doc = await Weight.findOneAndUpdate(
    { userId: req.userId, date },
    { $set: { weightKg } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json(doc);
});

router.delete("/:id", async (req, res) => {
  await Weight.deleteOne({ _id: req.params.id, userId: req.userId });
  res.json({ ok: true });
});

function num(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default router;
