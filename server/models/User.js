import mongoose from "mongoose";

const DemographicsSchema = new mongoose.Schema(
  {
    sex:          { type: String, enum: ["male", "female", "other", null], default: null },
    age:          { type: Number, default: null },
    heightCm:     { type: Number, default: null },
    // Becomes "starting weight" once the weights collection is live;
    // current weight reads from /api/weights now.
    weightKg:     { type: Number, default: null },
    fitnessLevel: { type: String, enum: ["beginner", "intermediate", "advanced", null], default: null },
  },
  { _id: false }
);

// Weekly schedule — one slot per weekday. Free-form string so users can
// add custom labels later (e.g. "swim", "long-run") without a schema
// migration. "rest" or null means rest day for day-type resolution.
const WeeklyScheduleSchema = new mongoose.Schema(
  {
    mon: { type: String, default: null },
    tue: { type: String, default: null },
    wed: { type: String, default: null },
    thu: { type: String, default: null },
    fri: { type: String, default: null },
    sat: { type: String, default: null },
    sun: { type: String, default: null },
  },
  { _id: false }
);

// Macro targets. Schema-level defaults are populated with sensible
// cutting-plan values for the first user; new users get the same and
// can edit in settings.
const TrainingDayTargetSchema = new mongoose.Schema(
  {
    kcal:     { type: Number, default: 2400 },
    proteinG: { type: Number, default: 180 },
    carbsG:   { type: Number, default: 250 },
    fatG:     { type: Number, default: 75 },
  },
  { _id: false }
);

const RestDayTargetSchema = new mongoose.Schema(
  {
    kcal:     { type: Number, default: 1950 },
    proteinG: { type: Number, default: 180 },
    carbsG:   { type: Number, default: 150 },
    fatG:     { type: Number, default: 75 },
  },
  { _id: false }
);

const TargetsSchema = new mongoose.Schema(
  {
    trainingDay: { type: TrainingDayTargetSchema, default: () => ({}) },
    restDay:     { type: RestDayTargetSchema,     default: () => ({}) },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    displayName:  { type: String, default: "" },
    demographics: { type: DemographicsSchema,    default: () => ({}) },
    weeklySchedule: { type: WeeklyScheduleSchema, default: () => ({}) },
    targets:        { type: TargetsSchema,        default: () => ({}) },
    onboardedAt:    { type: Date,   default: null },
    timezone:       { type: String, default: "America/Bogota" },
  },
  { timestamps: true }
);

UserSchema.method("toSafe", function () {
  const o = this.toObject();
  delete o.passwordHash;
  return o;
});

export default mongoose.model("User", UserSchema);
