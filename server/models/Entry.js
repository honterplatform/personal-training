import mongoose from "mongoose";

const EntrySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    activity: {
      type: String,
      required: true,
      enum: ["walk", "squash", "taekwondo", "strength", "protein"],
    },
    done: { type: Boolean, default: false },
    distanceKm: { type: Number, default: null },
    durationMin: { type: Number, default: null },
    rpe: { type: Number, default: null },
    proteinG: { type: Number, default: null },
    notes: { type: String, default: "" },
    caloriesBurned: { type: Number, default: null },
  },
  { timestamps: true }
);

EntrySchema.index({ date: 1, activity: 1 }, { unique: true });

export default mongoose.model("Entry", EntrySchema);
