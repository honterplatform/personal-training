import express from "express";
import Settings from "../models/Settings.js";

const router = express.Router();

async function getOrCreate() {
  let s = await Settings.findOne();
  if (!s) s = await Settings.create({});
  return s;
}

router.get("/", async (req, res) => {
  const s = await getOrCreate();
  res.json(s);
});

router.put("/", async (req, res) => {
  const { bodyWeightKg, proteinGoalG } = req.body || {};
  const s = await getOrCreate();
  if (bodyWeightKg != null) s.bodyWeightKg = Number(bodyWeightKg);
  if (proteinGoalG != null) s.proteinGoalG = Number(proteinGoalG);
  await s.save();
  res.json(s);
});

export default router;
