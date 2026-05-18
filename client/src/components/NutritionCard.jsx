import { useState } from "react";
import { useStore } from "../lib/store.jsx";
import { dayTypeFor, dayTypeLabel, targetFor, hasTargets } from "../lib/dayType.js";

const SLOT_ORDER = ["breakfast", "preTraining", "lunch", "snack", "dinner", "optional"];
const SLOT_LABEL = {
  breakfast:   "Breakfast",
  preTraining: "Pre-training",
  lunch:       "Lunch",
  snack:       "Snack",
  dinner:      "Dinner",
  optional:    "Optional",
};

export default function NutritionCard() {
  const { user, nutrition, selectedDate, createNutrition, deleteNutrition } = useStore();

  const dayMeals = nutrition.filter((m) => m.date === selectedDate);
  const dayType = dayTypeFor(user, selectedDate);
  const target = targetFor(user, selectedDate);

  const [expanded, setExpanded] = useState(dayMeals.length > 0);
  const [adding, setAdding] = useState(false);

  if (!hasTargets(user)) {
    return (
      <section className="nutrition-card collapsed">
        <span className={`day-type-chip ${dayType}`}>{dayTypeLabel(dayType)}</span>
        <span className="nutrition-card-cta">
          Set up calorie + macro targets in settings →
        </span>
      </section>
    );
  }

  const totals = dayMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      proteinG: acc.proteinG + (m.proteinG || 0),
      carbsG:   acc.carbsG   + (m.carbsG   || 0),
      fatG:     acc.fatG     + (m.fatG     || 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  const noMeals = dayMeals.length === 0;
  const showFull = expanded || !noMeals;

  if (!showFull) {
    return (
      <section
        className="nutrition-card collapsed"
        onClick={() => setExpanded(true)}
        role="button"
      >
        <span className={`day-type-chip ${dayType}`}>{dayTypeLabel(dayType)}</span>
        <span className="nutrition-card-empty-line">no meals logged</span>
        <button
          className="nutrition-card-add-mini"
          onClick={(e) => { e.stopPropagation(); setExpanded(true); setAdding(true); }}
        >
          + log meal
        </button>
      </section>
    );
  }

  return (
    <section className="nutrition-card">
      <header className="nutrition-card-header">
        <span className={`day-type-chip ${dayType}`}>{dayTypeLabel(dayType)}</span>
        {dayMeals.length === 0 && (
          <button
            className="nutrition-card-collapse"
            onClick={() => setExpanded(false)}
            title="collapse"
          >
            −
          </button>
        )}
      </header>

      <div className="nutrition-kcal">
        <span className="nutrition-kcal-actual">{totals.calories.toLocaleString()}</span>
        <span className="nutrition-kcal-sep"> / </span>
        <span className="nutrition-kcal-target">{target.kcal.toLocaleString()}</span>
        <span className="nutrition-kcal-unit"> kcal</span>
      </div>

      <MacroBar
        label="protein"
        actual={totals.proteinG}
        target={target.proteinG}
        unit="g"
        large
      />
      <MacroBar label="carbs" actual={totals.carbsG} target={target.carbsG} unit="g" />
      <MacroBar label="fat"   actual={totals.fatG}   target={target.fatG}   unit="g" />

      {dayMeals.length > 0 && (
        <ul className="meal-list">
          {[...dayMeals].sort(bySlot).map((m) => (
            <li key={m._id} className="meal-row">
              <span className="meal-slot">{SLOT_LABEL[m.mealSlot]}</span>
              <span className="meal-main">
                {m.notes ? <span className="meal-notes">{m.notes}</span> : null}
                <span className="meal-numbers">
                  {m.calories} kcal · {m.proteinG}P {m.carbsG}C {m.fatG}F
                </span>
              </span>
              <button
                className="meal-del"
                onClick={() => deleteNutrition(m._id)}
                aria-label="delete meal"
                title="delete"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <MealForm
          onCancel={() => setAdding(false)}
          onSubmit={async (body) => {
            await createNutrition({ date: selectedDate, ...body });
            setAdding(false);
          }}
        />
      ) : (
        <button className="nutrition-card-add" onClick={() => setAdding(true)}>
          + log meal
        </button>
      )}
    </section>
  );
}

function bySlot(a, b) {
  return SLOT_ORDER.indexOf(a.mealSlot) - SLOT_ORDER.indexOf(b.mealSlot);
}

function MacroBar({ label, actual, target, unit, large }) {
  const pct = target > 0 ? Math.min(1, actual / target) : 0;
  // Over-target overflow indicator
  const over = target > 0 && actual > target;

  let toneClass = "neutral";
  if (target > 0) {
    const ratio = actual / target;
    if (ratio >= 0.9) toneClass = "positive";
    else if (ratio < 0.7) toneClass = "behind";
  }

  return (
    <div className={`macro-bar ${large ? "large" : ""}`}>
      <div className="macro-bar-row">
        <span className="macro-bar-label">{label}</span>
        <span className="macro-bar-numbers">
          <span className={`macro-bar-actual ${toneClass}`}>
            {formatG(actual)}
          </span>
          <span className="macro-bar-sep"> / </span>
          <span className="macro-bar-target">{target}{unit}</span>
          {over && <span className="macro-bar-over"> +{formatG(actual - target)}</span>}
        </span>
      </div>
      <div className="macro-bar-track">
        <div className={`macro-bar-fill ${toneClass}`} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}

function formatG(v) {
  if (v == null) return "0";
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

/* ---------- meal log form ---------- */
function MealForm({ onCancel, onSubmit }) {
  const [mealSlot, setMealSlot] = useState("breakfast");
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const kcal = Number(calories || 0);
    if (kcal <= 0) {
      setError("calories required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        mealSlot,
        calories: kcal,
        proteinG: Number(proteinG || 0),
        carbsG:   Number(carbsG   || 0),
        fatG:     Number(fatG     || 0),
        notes:    notes.trim(),
      });
    } catch (err) {
      setError(err?.message || "could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="meal-form" onSubmit={submit}>
      <label className="meal-form-slot">
        <span className="ob-field-label">slot</span>
        <select value={mealSlot} onChange={(e) => setMealSlot(e.target.value)}>
          {SLOT_ORDER.map((s) => (
            <option key={s} value={s}>{SLOT_LABEL[s]}</option>
          ))}
        </select>
      </label>

      <div className="meal-form-grid">
        <NumField label="kcal" value={calories} onChange={setCalories} placeholder="0" autoFocus />
        <NumField label="protein" unit="g" value={proteinG} onChange={setProteinG} />
        <NumField label="carbs"   unit="g" value={carbsG}   onChange={setCarbsG} />
        <NumField label="fat"     unit="g" value={fatG}     onChange={setFatG} />
      </div>

      <label className="meal-form-notes">
        <span className="ob-field-label">notes <span className="optional">· optional</span></span>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="what you ate"
        />
      </label>

      {error && <div className="onboarding-error">{error}</div>}

      <div className="entry-form-actions">
        <button type="button" className="entry-cancel" onClick={onCancel}>cancel</button>
        <button type="submit" className="entry-submit" disabled={busy}>
          {busy ? "saving…" : "log meal"}
        </button>
      </div>
    </form>
  );
}

function NumField({ label, unit, value, onChange, placeholder, autoFocus }) {
  return (
    <label className="ob-field">
      <span className="ob-field-label">{label}</span>
      <div className="ob-field-input">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "0"}
          autoFocus={autoFocus}
        />
        {unit && <span className="ob-field-unit">{unit}</span>}
      </div>
    </label>
  );
}
