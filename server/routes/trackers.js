import express from "express";
import Tracker from "../models/Tracker.js";
import Entry from "../models/Entry.js";

const router = express.Router();

const KINDS = ["workout", "intake"];
const PERIODS = ["daily", "weekly"];
const METRICS_BY_KIND = {
  workout: ["sessions", "minutes", "km"],
  intake: ["amount"],
};

router.get("/", async (req, res) => {
  const includeArchived = req.query.includeArchived === "true";
  const filter = { userId: req.userId };
  if (!includeArchived) filter.archivedAt = null;
  const list = await Tracker.find(filter).sort({ pinned: -1, order: 1, createdAt: 1 });
  res.json(list);
});

router.post("/", async (req, res) => {
  const body = req.body || {};
  if (!KINDS.includes(body.kind)) return res.status(400).json({ error: "bad kind" });
  if (!body.name || typeof body.name !== "string") return res.status(400).json({ error: "missing name" });

  const target = normalizeTarget(body.kind, body.target);
  const last = await Tracker.findOne({ userId: req.userId }).sort({ order: -1 }).select("order");
  const order = (last?.order ?? -1) + 1;

  const t = await Tracker.create({
    userId: req.userId,
    kind: body.kind,
    name: body.name.trim().slice(0, 80),
    unit: body.kind === "intake" ? (body.unit || "g").trim().slice(0, 12) : "",
    target,
    pinned: body.pinned !== false,
    order,
  });
  res.status(201).json(t);
});

router.put("/:id", async (req, res) => {
  const t = await Tracker.findOne({ _id: req.params.id, userId: req.userId });
  if (!t) return res.status(404).json({ error: "not found" });
  const body = req.body || {};
  if (typeof body.name === "string") t.name = body.name.trim().slice(0, 80);
  if (typeof body.unit === "string") t.unit = body.unit.trim().slice(0, 12);
  if ("pinned" in body) t.pinned = !!body.pinned;
  if ("order" in body && Number.isFinite(Number(body.order))) t.order = Number(body.order);
  if ("archivedAt" in body) t.archivedAt = body.archivedAt ? new Date() : null;
  if (body.target) t.target = normalizeTarget(t.kind, body.target);
  await t.save();
  res.json(t);
});

router.delete("/:id", async (req, res) => {
  const t = await Tracker.findOne({ _id: req.params.id, userId: req.userId });
  if (!t) return res.status(404).json({ error: "not found" });
  await Entry.deleteMany({ userId: req.userId, trackerId: t._id });
  await t.deleteOne();
  res.json({ ok: true });
});

router.put("/order", async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  await Promise.all(
    items.map((it, i) =>
      Tracker.updateOne(
        { _id: it.id, userId: req.userId },
        { $set: { order: i, pinned: it.pinned !== false } }
      )
    )
  );
  res.json({ ok: true });
});

function normalizeTarget(kind, t) {
  if (!t) return {};
  const period = PERIODS.includes(t.period) ? t.period : kind === "intake" ? "daily" : "weekly";
  const allowed = METRICS_BY_KIND[kind] || ["sessions"];
  const metric = allowed.includes(t.metric) ? t.metric : allowed[0];
  const value = t.value == null || t.value === "" ? null : Number(t.value);
  return { period, value: Number.isFinite(value) ? value : null, metric };
}

export default router;
