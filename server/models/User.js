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
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, default: "" },
    demographics: { type: DemographicsSchema, default: () => ({}) },
    onboardedAt: { type: Date, default: null },
    timezone: { type: String, default: "America/Bogota" },
  },
  { timestamps: true }
);

UserSchema.method("toSafe", function () {
  const o = this.toObject();
  delete o.passwordHash;
  return o;
});

export default mongoose.model("User", UserSchema);
