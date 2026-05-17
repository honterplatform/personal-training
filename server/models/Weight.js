import mongoose from "mongoose";

const WeightSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date:     { type: String, required: true },   // YYYY-MM-DD in user TZ
    weightKg: { type: Number, required: true },
  },
  { timestamps: true }
);

// One weight per user per day — upserts replace the value cleanly.
WeightSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("Weight", WeightSchema);
