import express from "express";
import { computeInsights } from "../lib/insights.js";
import { insightsGet, insightsSet } from "../lib/insightsCache.js";
import { todayISO } from "../dates.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const date = req.query.date && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
    ? req.query.date
    : todayISO();

  const cached = insightsGet(req.userId, date);
  if (cached) return res.json({ ...cached, cached: true });

  const result = await computeInsights(req.userId, date);
  insightsSet(req.userId, date, result);
  res.json({ ...result, cached: false });
});

export default router;
