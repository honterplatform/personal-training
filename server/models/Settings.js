import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    bodyWeightKg: { type: Number, default: 75 },
    proteinGoalG: { type: Number, default: 150 },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", SettingsSchema);
