// One-shot migration. Idempotent — only writes fields that aren't already
// set on a user. Safe to re-run.
//
// Backfills:
//   - weeklySchedule (currently the cutting plan: TKD/squash/strength)
//   - targets.trainingDay + targets.restDay (only if missing)
//
// Usage:
//   npm run migrate          (from project root or server/)

import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../db.js";
import User from "../models/User.js";

const SCHEDULE_DEFAULT = {
  mon: "tkd",
  tue: "squash",
  wed: "strength+tkd",
  thu: "squash",
  fri: "tkd",
  sat: "rest",
  sun: "squash",
};

const TRAINING_TARGET_DEFAULT = { kcal: 2400, proteinG: 180, carbsG: 250, fatG: 75 };
const REST_TARGET_DEFAULT     = { kcal: 1950, proteinG: 180, carbsG: 150, fatG: 75 };

function isEmpty(obj) {
  if (!obj) return true;
  if (typeof obj.toObject === "function") obj = obj.toObject();
  return Object.values(obj).every((v) => v == null || v === "");
}

async function run() {
  await connectDB();
  const users = await User.find({});
  let touched = 0;

  for (const user of users) {
    let changed = false;

    if (isEmpty(user.weeklySchedule)) {
      user.weeklySchedule = SCHEDULE_DEFAULT;
      changed = true;
      console.log(`[migrate] set weeklySchedule for ${user.email}`);
    }

    if (user.targets?.trainingDay?.kcal == null) {
      user.targets = user.targets || {};
      user.targets.trainingDay = TRAINING_TARGET_DEFAULT;
      changed = true;
      console.log(`[migrate] set targets.trainingDay for ${user.email}`);
    }

    if (user.targets?.restDay?.kcal == null) {
      user.targets = user.targets || {};
      user.targets.restDay = REST_TARGET_DEFAULT;
      changed = true;
      console.log(`[migrate] set targets.restDay for ${user.email}`);
    }

    if (changed) {
      await user.save();
      touched++;
    }
  }

  console.log(`[migrate] done. ${touched} of ${users.length} user(s) updated.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
