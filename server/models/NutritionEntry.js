import mongoose from "mongoose";

export const MEAL_SLOTS = [
  "breakfast",
  "preTraining",
  "lunch",
  "snack",
  "dinner",
  "optional",
];

const NutritionEntrySchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date:     { type: String, required: true },         // YYYY-MM-DD
    mealSlot: { type: String, enum: MEAL_SLOTS, required: true },
    calories: { type: Number, default: 0 },
    proteinG: { type: Number, default: 0 },
    carbsG:   { type: Number, default: 0 },
    fatG:     { type: Number, default: 0 },
    notes:    { type: String, default: "" },
    source:     { type: String, enum: ["manual", "ai", "fallback"], default: "manual" },
    confidence: { type: String, enum: ["high", "med", "low", null], default: null },
    sourceText: { type: String, default: "" },  // raw text input when source != manual
  },
  { timestamps: true }
);

NutritionEntrySchema.index({ userId: 1, date: 1 });

export default mongoose.model("NutritionEntry", NutritionEntrySchema);
