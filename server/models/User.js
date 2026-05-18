import mongoose from "mongoose";

const DemographicsSchema = new mongoose.Schema(
  {
    sex:          { type: String, enum: ["male", "female", "other", null], default: null },
    age:          { type: Number, default: null },
    heightCm:     { type: Number, default: null },
    weightKg:     { type: Number, default: null },
    fitnessLevel: { type: String, enum: ["beginner", "intermediate", "advanced", null], default: null },
  },
  { _id: false }
);

const TargetsSchema = new mongoose.Schema(
  {
    kcal:     { type: Number, default: 2400 },
    proteinG: { type: Number, default: 180 },
    carbsG:   { type: Number, default: 250 },
    fatG:     { type: Number, default: 75 },
  },
  { _id: false }
);

const AiCallsSchema = new mongoose.Schema(
  {
    date:     { type: String, default: null },
    estimate: { type: Number, default: 0 },
    coach:    { type: Number, default: 0 },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    displayName:  { type: String, default: "" },
    demographics: { type: DemographicsSchema, default: () => ({}) },
    targets:      { type: TargetsSchema,      default: () => ({}) },
    aiCalls:      { type: AiCallsSchema,      default: () => ({}) },
    onboardedAt:  { type: Date,   default: null },
    timezone:     { type: String, default: "America/Bogota" },
  },
  { timestamps: true, strict: false }
);

UserSchema.method("toSafe", function () {
  const o = this.toObject();
  delete o.passwordHash;
  // Strip legacy fields that may still exist on old docs.
  delete o.weeklySchedule;
  if (o.targets && (o.targets.trainingDay || o.targets.restDay)) {
    const t = o.targets.trainingDay || o.targets.restDay || {};
    o.targets = {
      kcal:     t.kcal     ?? o.targets.kcal     ?? null,
      proteinG: t.proteinG ?? o.targets.proteinG ?? null,
      carbsG:   t.carbsG   ?? o.targets.carbsG   ?? null,
      fatG:     t.fatG     ?? o.targets.fatG     ?? null,
    };
  }
  return o;
});

export default mongoose.model("User", UserSchema);
