// One-shot, idempotent boot migration: flattens user.targets and removes
// user.weeklySchedule on existing docs. Safe to run on every server start.
//
// Runs against the raw collection so it bypasses Mongoose strict-mode
// stripping (which would otherwise drop trainingDay/restDay before we
// could read them).

import mongoose from "mongoose";

export async function runBootMigrations() {
  const db = mongoose.connection.db;
  if (!db) return;

  const Users = db.collection("users");
  const cursor = Users.find({
    $or: [
      { weeklySchedule: { $exists: true } },
      { "targets.trainingDay": { $exists: true } },
      { "targets.restDay": { $exists: true } },
    ],
  });

  let migrated = 0;
  for await (const u of cursor) {
    const set = {};
    const unset = {};
    if (u.targets && (u.targets.trainingDay || u.targets.restDay)) {
      const t = u.targets.trainingDay || u.targets.restDay || {};
      set.targets = {
        kcal:     t.kcal     ?? u.targets.kcal     ?? null,
        proteinG: t.proteinG ?? u.targets.proteinG ?? null,
        carbsG:   t.carbsG   ?? u.targets.carbsG   ?? null,
        fatG:     t.fatG     ?? u.targets.fatG     ?? null,
      };
    }
    if (u.weeklySchedule !== undefined) unset.weeklySchedule = "";
    const mods = {};
    if (Object.keys(set).length) mods.$set = set;
    if (Object.keys(unset).length) mods.$unset = unset;
    if (Object.keys(mods).length) {
      await Users.updateOne({ _id: u._id }, mods);
      migrated += 1;
    }
  }
  if (migrated) console.log(`[migrate] flattened ${migrated} user doc(s)`);
}
