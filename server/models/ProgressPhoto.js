import mongoose from "mongoose";

const ProgressPhotoSchema = new mongoose.Schema(
  {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date:        { type: String, required: true },
    angle:       { type: String, enum: ["front", "side", "back"], required: true },
    imageKey:    { type: String, required: true },     // "<userId>/<photoId>.jpg"
    contentType: { type: String, default: "image/jpeg" },
    bytes:       { type: Number, default: 0 },
    width:       { type: Number, default: 0 },
    height:      { type: Number, default: 0 },
    notes:       { type: String, default: "" },
  },
  { timestamps: true }
);

ProgressPhotoSchema.index({ userId: 1, date: 1, angle: 1 });

export const ANGLES = ["front", "side", "back"];

export default mongoose.model("ProgressPhoto", ProgressPhotoSchema);
