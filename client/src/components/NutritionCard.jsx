import { useEffect, useRef, useState } from "react";
import { useStore } from "../lib/store.jsx";
import { api } from "../lib/api.js";
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
  const {
    user, nutrition, templates, selectedDate,
    createNutrition, deleteNutrition,
  } = useStore();

  const dayMeals = nutrition.filter((m) => m.date === selectedDate);
  const dayType = dayTypeFor(user, selectedDate);
  const target = targetFor(user, selectedDate);

  const [expanded, setExpanded] = useState(dayMeals.length > 0);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState(null);

  function flashToast(msg, undoFn) {
    setToast({ msg, undoFn });
    setTimeout(() => setToast(null), 4000);
  }

  async function logFromTemplate(t) {
    const created = await createNutrition({
      date:       selectedDate,
      mealSlot:   t.mealSlot,
      calories:   t.calories,
      proteinG:   t.proteinG,
      carbsG:     t.carbsG,
      fatG:       t.fatG,
      sourceText: t.sourceText || "",
      notes:      t.name,
      source:     "manual",
    });
    flashToast(`logged ${t.name}`, async () => {
      try { await deleteNutrition(created._id); } catch {}
    });
    setExpanded(true);
  }

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
  const pinnedTemplates = templates.filter((t) => t.pinned);

  if (noMeals && !expanded) {
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
        {toast && <Toast {...toast} />}
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

      <MacroBar label="protein" actual={totals.proteinG} target={target.proteinG} unit="g" large />
      <MacroBar label="carbs"   actual={totals.carbsG}   target={target.carbsG}   unit="g" />
      <MacroBar label="fat"     actual={totals.fatG}     target={target.fatG}     unit="g" />

      {pinnedTemplates.length > 0 && (
        <div className="meal-templates">
          {pinnedTemplates.slice(0, 12).map((t) => (
            <button
              key={t._id}
              className="meal-template-chip"
              title={`${t.calories} kcal · ${t.proteinG}P ${t.carbsG}C ${t.fatG}F`}
              onClick={() => logFromTemplate(t)}
            >
              {t.name}
              <span className="meal-template-kcal">{t.calories}</span>
            </button>
          ))}
        </div>
      )}

      {dayMeals.length > 0 && (
        <ul className="meal-list">
          {[...dayMeals].sort(bySlot).map((m) => (
            <MealRow key={m._id} m={m} onDelete={() => deleteNutrition(m._id)} />
          ))}
        </ul>
      )}

      {adding ? (
        <MealForm
          onCancel={() => setAdding(false)}
          onSaved={() => { setAdding(false); flashToast("logged", null); }}
        />
      ) : (
        <button className="nutrition-card-add" onClick={() => setAdding(true)}>
          + log meal
        </button>
      )}

      {toast && <Toast {...toast} />}
    </section>
  );
}

function bySlot(a, b) {
  return SLOT_ORDER.indexOf(a.mealSlot) - SLOT_ORDER.indexOf(b.mealSlot);
}

function Toast({ msg, undoFn }) {
  return (
    <div className="meal-toast">
      <span>{msg}</span>
      {undoFn && (
        <button className="meal-toast-undo" onClick={undoFn}>undo</button>
      )}
    </div>
  );
}

function MealRow({ m, onDelete }) {
  return (
    <li className="meal-row">
      <span className="meal-slot">{SLOT_LABEL[m.mealSlot]}</span>
      <span className="meal-main">
        {m.notes ? <span className="meal-notes">{m.notes}</span> : null}
        {m.sourceText && !m.notes ? <span className="meal-notes">{m.sourceText}</span> : null}
        <span className="meal-numbers">
          {m.calories} kcal · {m.proteinG}P {m.carbsG}C {m.fatG}F
        </span>
      </span>
      <SourceChip source={m.source} confidence={m.confidence} />
      <button className="meal-del" onClick={onDelete} aria-label="delete meal" title="delete">
        ✕
      </button>
    </li>
  );
}

function SourceChip({ source, confidence }) {
  if (source === "fallback") {
    return <span className="meal-source-chip fallback" title="estimated by keyword fallback — double-check">check</span>;
  }
  if (source === "ai" && confidence === "med") {
    return <span className="meal-source-chip ai-med" title="AI estimate, medium confidence">≈</span>;
  }
  if (source === "ai" && confidence === "low") {
    return <span className="meal-source-chip ai-low" title="AI estimate, low confidence">≈?</span>;
  }
  // manual or ai/high → no chip
  return null;
}

function MacroBar({ label, actual, target, unit, large }) {
  const pct = target > 0 ? Math.min(1, actual / target) : 0;
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
          <span className={`macro-bar-actual ${toneClass}`}>{formatG(actual)}</span>
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

/* ---------- two-step meal form: estimate then confirm ---------- */
function MealForm({ onCancel, onSaved }) {
  const { selectedDate, createNutrition, createTemplate } = useStore();

  // State machine: "text" → "review" ("manual" is the alternate branch)
  const [stage, setStage] = useState("text");
  const [mealSlot, setMealSlot] = useState("breakfast");
  const [text, setText] = useState("");
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState(null);
  const [quotaError, setQuotaError] = useState(null);
  const [draft, setDraft] = useState({
    calories: "", proteinG: "", carbsG: "", fatG: "",
    source: "manual", confidence: null, sourceText: "",
  });
  const [notes, setNotes] = useState("");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const textInputRef = useRef(null);

  useEffect(() => { textInputRef.current?.focus(); }, []);

  async function runEstimate(e) {
    e?.preventDefault?.();
    if (!text.trim() || estimating) return;
    setEstimating(true);
    setEstimateError(null);
    setQuotaError(null);
    try {
      const r = await api.estimateMeal({ text: text.trim(), mealSlot });
      setDraft({
        calories: String(r.calories),
        proteinG: String(r.proteinG),
        carbsG:   String(r.carbsG),
        fatG:     String(r.fatG),
        source:     r.source,
        confidence: r.confidence,
        sourceText: text.trim(),
      });
      setStage("review");
    } catch (err) {
      if (err?.status === 429) {
        setQuotaError(err.message || "AI limit reached today");
        // Drop to manual entry — same form, no estimate
        setStage("manual");
      } else {
        setEstimateError(err?.message || "could not estimate");
      }
    } finally {
      setEstimating(false);
    }
  }

  async function confirmSave(e) {
    e?.preventDefault?.();
    const body = {
      date: selectedDate,
      mealSlot,
      calories: num(draft.calories),
      proteinG: num(draft.proteinG),
      carbsG:   num(draft.carbsG),
      fatG:     num(draft.fatG),
      notes:    notes.trim(),
      source:     draft.source,
      confidence: draft.confidence,
      sourceText: draft.sourceText,
    };
    if (body.calories <= 0) {
      setEstimateError("calories required");
      return;
    }
    await createNutrition(body);

    if (saveAsTemplate && templateName.trim()) {
      try {
        await createTemplate({
          name:       templateName.trim(),
          mealSlot,
          calories:   body.calories,
          proteinG:   body.proteinG,
          carbsG:     body.carbsG,
          fatG:       body.fatG,
          sourceText: body.sourceText || text.trim(),
        });
      } catch {}
    }

    onSaved?.();
  }

  // --- Stage: text input ---
  if (stage === "text") {
    return (
      <form className="meal-form" onSubmit={runEstimate}>
        <div className="meal-form-text-row">
          <label className="meal-form-slot inline">
            <span className="ob-field-label">slot</span>
            <select value={mealSlot} onChange={(e) => setMealSlot(e.target.value)}>
              {SLOT_ORDER.map((s) => <option key={s} value={s}>{SLOT_LABEL[s]}</option>)}
            </select>
          </label>
          <input
            ref={textInputRef}
            className="meal-form-text"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="200g chicken breast, 200g rice, salad with avocado"
          />
        </div>

        {estimateError && <div className="onboarding-error">{estimateError}</div>}

        <div className="entry-form-actions">
          <button type="button" className="entry-cancel" onClick={onCancel}>cancel</button>
          <button type="button" className="meal-form-manual-link" onClick={() => setStage("manual")}>
            enter manually
          </button>
          <button type="submit" className="entry-submit" disabled={!text.trim() || estimating}>
            {estimating ? "thinking…" : "estimate →"}
          </button>
        </div>
      </form>
    );
  }

  // --- Stage: review estimated macros (edit-in-place) ---
  if (stage === "review") {
    return (
      <form className="meal-form" onSubmit={confirmSave}>
        <div className="meal-form-review-head">
          <span className={`meal-source-chip ${draft.source === "ai" ? "ai-" + (draft.confidence || "low") : "fallback"}`}>
            {draft.source === "ai" ? `≈ AI · ${draft.confidence}` : "check (fallback)"}
          </span>
          <button type="button" className="meal-form-back" onClick={() => setStage("text")}>
            ← edit text
          </button>
        </div>
        <div className="meal-form-text-readback">{text}</div>

        <ReviewGrid draft={draft} setDraft={setDraft} />

        <SaveAsTemplate
          enabled={saveAsTemplate}
          setEnabled={setSaveAsTemplate}
          name={templateName}
          setName={setTemplateName}
          suggestion={defaultTemplateName(text)}
        />

        <label className="meal-form-notes">
          <span className="ob-field-label">notes <span className="optional">· optional</span></span>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>

        {estimateError && <div className="onboarding-error">{estimateError}</div>}

        <div className="entry-form-actions">
          <button type="button" className="entry-cancel" onClick={onCancel}>cancel</button>
          <button type="submit" className="entry-submit">log meal</button>
        </div>
      </form>
    );
  }

  // --- Stage: manual entry (no AI) ---
  return (
    <form className="meal-form" onSubmit={confirmSave}>
      <label className="meal-form-slot">
        <span className="ob-field-label">slot</span>
        <select value={mealSlot} onChange={(e) => setMealSlot(e.target.value)}>
          {SLOT_ORDER.map((s) => <option key={s} value={s}>{SLOT_LABEL[s]}</option>)}
        </select>
      </label>

      {quotaError && <div className="meal-form-quota">{quotaError}</div>}

      <ReviewGrid draft={draft} setDraft={setDraft} />

      <SaveAsTemplate
        enabled={saveAsTemplate}
        setEnabled={setSaveAsTemplate}
        name={templateName}
        setName={setTemplateName}
        suggestion=""
      />

      <label className="meal-form-notes">
        <span className="ob-field-label">notes <span className="optional">· optional</span></span>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      {estimateError && <div className="onboarding-error">{estimateError}</div>}

      <div className="entry-form-actions">
        <button type="button" className="entry-cancel" onClick={onCancel}>cancel</button>
        <button type="button" className="meal-form-manual-link" onClick={() => { setStage("text"); setQuotaError(null); }}>
          ← use AI
        </button>
        <button type="submit" className="entry-submit">log meal</button>
      </div>
    </form>
  );
}

function ReviewGrid({ draft, setDraft }) {
  function set(k) {
    return (v) => setDraft((d) => ({ ...d, [k]: v, source: "manual", confidence: null }));
  }
  return (
    <div className="meal-form-grid">
      <NumField label="kcal" value={draft.calories} onChange={set("calories")} />
      <NumField label="protein" unit="g" value={draft.proteinG} onChange={set("proteinG")} />
      <NumField label="carbs"   unit="g" value={draft.carbsG}   onChange={set("carbsG")} />
      <NumField label="fat"     unit="g" value={draft.fatG}     onChange={set("fatG")} />
    </div>
  );
}

function SaveAsTemplate({ enabled, setEnabled, name, setName, suggestion }) {
  useEffect(() => {
    if (enabled && !name) setName(suggestion || "");
  }, [enabled]);
  return (
    <label className="meal-form-template">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => setEnabled(e.target.checked)}
      />
      <span>save as one-tap template</span>
      {enabled && (
        <input
          type="text"
          className="meal-form-template-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="template name"
        />
      )}
    </label>
  );
}

function defaultTemplateName(text) {
  return text.trim().split(",")[0]?.trim().slice(0, 40) || "";
}

function NumField({ label, unit, value, onChange }) {
  return (
    <label className="ob-field">
      <span className="ob-field-label">{label}</span>
      <div className="ob-field-input">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
        />
        {unit && <span className="ob-field-unit">{unit}</span>}
      </div>
    </label>
  );
}

function num(v) {
  if (v === "" || v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
