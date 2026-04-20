import mongoose from "mongoose";

const SummarySchema = new mongoose.Schema({
  weekStart: { type: String, required: true, unique: true },
  text: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Summary", SummarySchema);
