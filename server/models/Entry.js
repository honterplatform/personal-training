import mongoose from "mongoose";

const EntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    trackerId: { type: mongoose.Schema.Types.ObjectId, ref: "Tracker", required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD (user's local timezone)

    // Workout fields
    durationMin: { type: Number, default: null },
    distanceKm: { type: Number, default: null },
    rpe: { type: Number, default: null },
    caloriesBurned: { type: Number, default: null },
    caloriesBurnedSource: { type: String, enum: ["ai", "manual", "fallback", null], default: null },

    // Intake fields
    amount: { type: Number, default: null },

    // Common
    notes: { type: String, default: "" },
    done: { type: Boolean, default: true }, // intake/workout entries are "logged" by existing
  },
  { timestamps: true }
);

EntrySchema.index({ userId: 1, trackerId: 1, date: 1 });
EntrySchema.index({ userId: 1, date: 1 });

export default mongoose.model("Entry", EntrySchema);
