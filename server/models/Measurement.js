import mongoose from "mongoose";

const MeasurementSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date:    { type: String, required: true },        // YYYY-MM-DD in user TZ
    waistCm: { type: Number, default: null },
    neckCm:  { type: Number, default: null },
    hipCm:   { type: Number, default: null },
    notes:   { type: String, default: "" },
  },
  { timestamps: true }
);

// One row per user per day — upserts replace.
MeasurementSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("Measurement", MeasurementSchema);
