import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./db.js";
import Settings from "./models/Settings.js";
import Entry from "./models/Entry.js";
import { todayISO } from "./dates.js";

(async () => {
  try {
    await connectDB();
    const today = todayISO();

    let s = await Settings.findOne();
    if (!s) s = await Settings.create({ bodyWeightKg: 75, proteinGoalG: 150 });
    console.log("[seed] settings:", s.toObject());

    const samples = [
      {
        date: today,
        activity: "walk",
        done: true,
        distanceKm: 6.2,
        durationMin: 65,
        rpe: 4,
        notes: "easy morning loop",
        caloriesBurned: 235,
      },
      {
        date: today,
        activity: "strength",
        done: false,
        durationMin: null,
        rpe: null,
        notes: "",
      },
      {
        date: today,
        activity: "protein",
        done: false,
        proteinG: 90,
        notes: "",
      },
    ];

    for (const e of samples) {
      await Entry.findOneAndUpdate(
        { date: e.date, activity: e.activity },
        { $set: e },
        { upsert: true, setDefaultsOnInsert: true }
      );
      console.log("[seed] entry:", e.date, e.activity);
    }

    await mongoose.disconnect();
    console.log("[seed] done");
  } catch (err) {
    console.error("[seed] failed:", err);
    process.exit(1);
  }
})();
