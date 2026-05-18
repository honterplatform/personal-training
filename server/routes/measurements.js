import express from "express";
import Measurement from "../models/Measurement.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: "start and end required" });
  const list = await Measurement.find({
    userId: req.userId,
    date: { $gte: start, $lte: end },
  }).sort({ date: 1 });
  res.json(list);
});

router.post("/", async (req, res) => {
  const body = req.body || {};
  const date = body.date;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "date required (YYYY-MM-DD)" });
  }

  const update = {};
  if ("waistCm" in body) update.waistCm = num(body.waistCm);
  if ("neckCm"  in body) update.neckCm  = num(body.neckCm);
  if ("hipCm"   in body) update.hipCm   = num(body.hipCm);
  if ("notes"   in body) update.notes   = (body.notes || "").toString().slice(0, 500);

  // Upsert by (userId, date) so re-logging the same day replaces values.
  const doc = await Measurement.findOneAndUpdate(
    { userId: req.userId, date },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json(doc);
});

router.put("/:id", async (req, res) => {
  const m = await Measurement.findOne({ _id: req.params.id, userId: req.userId });
  if (!m) return res.status(404).json({ error: "not found" });
  const body = req.body || {};
  if ("waistCm" in body) m.waistCm = num(body.waistCm);
  if ("neckCm"  in body) m.neckCm  = num(body.neckCm);
  if ("hipCm"   in body) m.hipCm   = num(body.hipCm);
  if ("notes"   in body) m.notes   = (body.notes || "").toString().slice(0, 500);
  await m.save();
  res.json(m);
});

router.delete("/:id", async (req, res) => {
  await Measurement.deleteOne({ _id: req.params.id, userId: req.userId });
  res.json({ ok: true });
});

function num(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default router;
