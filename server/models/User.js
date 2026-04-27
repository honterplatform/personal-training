import mongoose from "mongoose";

const DemographicsSchema = new mongoose.Schema(
  {
    sex: { type: String, enum: ["male", "female", "other", null], default: null },
    age: { type: Number, default: null },
    heightCm: { type: Number, default: null },
    weightKg: { type: Number, default: null },
    fitnessLevel: { type: String, enum: ["beginner", "intermediate", "advanced", null], default: null },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    // _id is the Clerk user id (string, e.g. "user_2abc...")
    _id: { type: String, required: true },
    email: { type: String, default: "", lowercase: true, trim: true, index: true },
    displayName: { type: String, default: "" },
    demographics: { type: DemographicsSchema, default: () => ({}) },
    onboardedAt: { type: Date, default: null },
    timezone: { type: String, default: "America/Bogota" },
  },
  { timestamps: true, _id: false }
);

UserSchema.method("toSafe", function () {
  const o = this.toObject();
  return o;
});

export default mongoose.model("User", UserSchema);
