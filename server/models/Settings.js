import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    bodyWeightKg: { type: Number, default: 75 },
    proteinGoalG: { type: Number, default: 150 },
    sex: { type: String, enum: ["male", "female", "other", null], default: null },
    age: { type: Number, default: null },
    fitnessLevel: { type: String, enum: ["beginner", "intermediate", "advanced", null], default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", SettingsSchema);
