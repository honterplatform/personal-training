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
  const body = req.body || {};
  const s = await getOrCreate();
  if ("bodyWeightKg" in body) s.bodyWeightKg = Number(body.bodyWeightKg);
  if ("proteinGoalG" in body) s.proteinGoalG = Number(body.proteinGoalG);
  if ("sex" in body) s.sex = body.sex || null;
  if ("age" in body) s.age = body.age === "" || body.age == null ? null : Number(body.age);
  if ("fitnessLevel" in body) s.fitnessLevel = body.fitnessLevel || null;
  await s.save();
  res.json(s);
});

export default router;
