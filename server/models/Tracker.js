import mongoose from "mongoose";

const TargetSchema = new mongoose.Schema(
  {
    period: { type: String, enum: ["daily", "weekly"], default: "weekly" },
    value: { type: Number, default: null },
    metric: { type: String, default: "sessions" },
  },
  { _id: false }
);

const TrackerSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    kind: { type: String, enum: ["workout", "intake"], required: true },
    name: { type: String, required: true, trim: true },
    unit: { type: String, default: "" },
    target: { type: TargetSchema, default: () => ({}) },
    pinned: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

TrackerSchema.index({ userId: 1, archivedAt: 1, order: 1 });

export default mongoose.model("Tracker", TrackerSchema);
