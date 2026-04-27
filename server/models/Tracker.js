import mongoose from "mongoose";

const TargetSchema = new mongoose.Schema(
  {
    period: { type: String, enum: ["daily", "weekly"], default: "weekly" },
    value: { type: Number, default: null },
    metric: { type: String, default: "sessions" }, // sessions | minutes | km | amount
  },
  { _id: false }
);

const TrackerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: ["workout", "intake"], required: true },
    name: { type: String, required: true, trim: true },
    unit: { type: String, default: "" }, // intake unit: "g", "mg", "ml", etc; workout: "" (sessions counted)
    target: { type: TargetSchema, default: () => ({}) },
    pinned: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

TrackerSchema.index({ userId: 1, archivedAt: 1, order: 1 });

export default mongoose.model("Tracker", TrackerSchema);
