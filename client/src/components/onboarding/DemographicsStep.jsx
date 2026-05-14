import { useState } from "react";

const SEX_OPTIONS = [
  { id: "male", label: "male" },
  { id: "female", label: "female" },
  { id: "other", label: "other" },
];
const FITNESS_OPTIONS = [
  { id: "beginner", label: "beginner" },
  { id: "intermediate", label: "intermediate" },
  { id: "advanced", label: "advanced" },
];

export default function DemographicsStep({ initial, displayName, saving, error, onSubmit }) {
  const [sex, setSex] = useState(initial?.sex ?? "");
  const [age, setAge] = useState(initial?.age != null ? String(initial.age) : "");
  const [heightCm, setHeightCm] = useState(initial?.heightCm != null ? String(initial.heightCm) : "");
  const [weightKg, setWeightKg] = useState(initial?.weightKg != null ? String(initial.weightKg) : "");
  const [fitnessLevel, setFitnessLevel] = useState(initial?.fitnessLevel ?? "");

  function submit(e) {
    e.preventDefault();
    if (saving) return;
    onSubmit({
      sex: sex || null,
      age: age === "" ? null : Number(age),
      heightCm: heightCm === "" ? null : Number(heightCm),
      weightKg: weightKg === "" ? null : Number(weightKg),
      fitnessLevel: fitnessLevel || null,
    });
  }

  return (
    <form className="onboarding-step" onSubmit={submit}>
      <div className="onboarding-eyebrow">step 1 of 2</div>
      <h1 className="onboarding-title">
        hi{displayName ? `, ${displayName.split(" ")[0]}` : ""} —<br />
        tell the coach about you
      </h1>
      <p className="onboarding-sub">
        Used to estimate calories burned per workout. You can edit any of these
        later in settings.
      </p>

      <div className="onboarding-fields">
        <Field label="age" unit="yrs">
          <input
            type="number"
            inputMode="numeric"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="e.g. 32"
          />
        </Field>
        <Field label="height" unit="cm">
          <input
            type="number"
            inputMode="numeric"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            placeholder="e.g. 178"
          />
        </Field>
        <Field label="weight" unit="kg">
          <input
            type="number"
            inputMode="decimal"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="e.g. 75"
          />
        </Field>

        <Pills label="sex" options={SEX_OPTIONS} value={sex} onChange={setSex} />
        <Pills
          label="fitness level"
          hint="how seriously you train — more fit means slightly fewer kcal for the same work"
          options={FITNESS_OPTIONS}
          value={fitnessLevel}
          onChange={setFitnessLevel}
        />
      </div>

      {error && <div className="onboarding-error">{error}</div>}

      <button className="onboarding-next" type="submit" disabled={saving}>
        {saving ? "…" : "next →"}
      </button>
      <div className="onboarding-skip-note">
        all fields optional · skip what you'd rather not share
      </div>
    </form>
  );
}

function Field({ label, unit, children }) {
  return (
    <label className="ob-field">
      <span className="ob-field-label">{label}</span>
      <div className="ob-field-input">
        {children}
        {unit ? <span className="ob-field-unit">{unit}</span> : null}
      </div>
    </label>
  );
}

function Pills({ label, hint, options, value, onChange }) {
  return (
    <div className="ob-pills">
      <div className="ob-field-label">{label}</div>
      {hint ? <div className="ob-pills-hint">{hint}</div> : null}
      <div className="ob-pills-row">
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              type="button"
              key={opt.id}
              onClick={() => onChange(active ? "" : opt.id)}
              className={`ob-pill ${active ? "active" : ""}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
