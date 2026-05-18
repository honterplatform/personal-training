import mongoose from "mongoose";
import { MEAL_SLOTS } from "./NutritionEntry.js";

const MealTemplateSchema = new mongoose.Schema(
  {
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name:       { type: String, required: true, trim: true },
    mealSlot:   { type: String, enum: MEAL_SLOTS, required: true },
    calories:   { type: Number, default: 0 },
    proteinG:   { type: Number, default: 0 },
    carbsG:     { type: Number, default: 0 },
    fatG:       { type: Number, default: 0 },
    sourceText: { type: String, default: "" },  // original AI-parsed text, for reuse / display
    pinned:     { type: Boolean, default: true },
    order:      { type: Number, default: 0 },
  },
  { timestamps: true }
);

MealTemplateSchema.index({ userId: 1, pinned: -1, order: 1 });

export default mongoose.model("MealTemplate", MealTemplateSchema);
