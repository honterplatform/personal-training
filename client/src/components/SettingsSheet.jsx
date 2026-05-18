import { useEffect, useState } from "react";
import { useStore } from "../lib/store.jsx";
import { api } from "../lib/api.js";
import { XIcon } from "./Icons.jsx";

export default function SettingsSheet({ onClose }) {
  const {
    user, trackers, templates,
    updateProfile, createTracker, updateTracker, deleteTracker,
    updateTemplate, deleteTemplate,
    signOut, deleteAccount,
  } = useStore();

  return (
    <div className="settings-backdrop" onClick={onClose}>
      <div className="settings-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="settings-grabber" />
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button className="settings-close" onClick={onClose} aria-label="close">
            <XIcon size={16} />
          </button>
        </div>

        <div className="settings-body">
          <ProfileSection user={user} updateProfile={updateProfile} />
          <DemographicsSection user={user} updateProfile={updateProfile} />
          <ScheduleSection user={user} updateProfile={updateProfile} />
          <TargetsSection user={user} updateProfile={updateProfile} />
          <TrackersSection
            trackers={trackers}
            createTracker={createTracker}
            updateTracker={updateTracker}
            deleteTracker={deleteTracker}
          />
          <TemplatesSection
            templates={templates}
            updateTemplate={updateTemplate}
            deleteTemplate={deleteTemplate}
          />
          <AccountSection signOut={signOut} deleteAccount={deleteAccount} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Profile ---------- */
function ProfileSection({ user, updateProfile }) {
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      await updateProfile({ displayName });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="Profile">
      <div className="ob-field">
        <span className="ob-field-label">display name</span>
        <div className="ob-field-input">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="your name"
            onBlur={save}
          />
        </div>
      </div>
      <div className="settings-readonly">
        <span className="ob-field-label">email</span>
        <span className="settings-readonly-value">{user?.email}</span>
      </div>
      {savedFlash && <div className="settings-saved-flash">saved</div>}
    </Section>
  );
}

/* ---------- Demographics ---------- */
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

function DemographicsSection({ user, updateProfile }) {
  const d = user?.demographics || {};
  const [age, setAge] = useState(d.age != null ? String(d.age) : "");
  const [heightCm, setHeightCm] = useState(d.heightCm != null ? String(d.heightCm) : "");
  const [weightKg, setWeightKg] = useState(d.weightKg != null ? String(d.weightKg) : "");
  const [sex, setSex] = useState(d.sex || "");
  const [fitness, setFitness] = useState(d.fitnessLevel || "");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  async function save(patch) {
    if (saving) return;
    setSaving(true);
    try {
      await updateProfile({
        demographics: {
          age: age === "" ? null : Number(age),
          heightCm: heightCm === "" ? null : Number(heightCm),
          weightKg: weightKg === "" ? null : Number(weightKg),
          sex: sex || null,
          fitnessLevel: fitness || null,
          ...patch,
        },
      });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="About you">
      <div className="settings-tri-row">
        <Field label="age" unit="yrs">
          <input
            type="number"
            inputMode="numeric"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            onBlur={() => save({})}
            placeholder="—"
          />
        </Field>
        <Field label="height" unit="cm">
          <input
            type="number"
            inputMode="numeric"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            onBlur={() => save({})}
            placeholder="—"
          />
        </Field>
        <Field label="weight" unit="kg">
          <input
            type="number"
            inputMode="decimal"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            onBlur={() => save({})}
            placeholder="—"
          />
        </Field>
      </div>

      <Pills
        label="sex"
        options={SEX_OPTIONS}
        value={sex}
        onChange={(v) => { setSex(v); save({ sex: v || null }); }}
      />
      <Pills
        label="fitness level"
        hint="more fit = slightly fewer kcal for the same work"
        options={FITNESS_OPTIONS}
        value={fitness}
        onChange={(v) => { setFitness(v); save({ fitnessLevel: v || null }); }}
      />
      {savedFlash && <div className="settings-saved-flash">saved</div>}
    </Section>
  );
}

/* ---------- Trackers ---------- */
function TrackersSection({ trackers, createTracker, updateTracker, deleteTracker }) {
  const [adding, setAdding] = useState(false);

  return (
    <Section title="Trackers">
      <div className="settings-tracker-list">
        {trackers.length === 0 && (
          <div className="settings-tracker-empty">No trackers yet.</div>
        )}
        {trackers.map((t) => (
          <TrackerRow
            key={t._id}
            tracker={t}
            onUpdate={(body) => updateTracker(t._id, body)}
            onDelete={() => {
              if (confirm(`Delete "${t.name}" and all its entries?`)) deleteTracker(t._id);
            }}
          />
        ))}
      </div>

      {adding ? (
        <NewTrackerForm
          onCancel={() => setAdding(false)}
          onSubmit={async (body) => { await createTracker(body); setAdding(false); }}
        />
      ) : (
        <button className="settings-add-btn" onClick={() => setAdding(true)}>
          + add tracker
        </button>
      )}
    </Section>
  );
}

const MACRO_TRACKER_RE = /^(protein|carbs?|fat|calories?|kcal)$/i;
const DISMISSED_BANNER_KEY = "log:dismissedMacroBanner";

function TrackerRow({ tracker, onUpdate, onDelete }) {
  const [name, setName] = useState(tracker.name);
  const [unit, setUnit] = useState(tracker.unit || "");
  const [target, setTarget] = useState(
    tracker.target?.value != null ? String(tracker.target.value) : ""
  );
  const [pinned, setPinned] = useState(tracker.pinned);

  // Phase 1 deprecation: macro tracking moved to the Nutrition card.
  const isLegacyMacro = MACRO_TRACKER_RE.test(tracker.name || "");
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try {
      const ids = JSON.parse(localStorage.getItem(DISMISSED_BANNER_KEY) || "[]");
      return Array.isArray(ids) && ids.includes(tracker._id);
    } catch { return false; }
  });
  function dismissBanner() {
    try {
      const ids = JSON.parse(localStorage.getItem(DISMISSED_BANNER_KEY) || "[]");
      const next = Array.isArray(ids) ? Array.from(new Set([...ids, tracker._id])) : [tracker._id];
      localStorage.setItem(DISMISSED_BANNER_KEY, JSON.stringify(next));
    } catch {}
    setBannerDismissed(true);
  }

  const isIntake = tracker.kind === "intake";

  function commit(patch = {}) {
    onUpdate({
      name: name.trim() || tracker.name,
      unit: isIntake ? (unit.trim() || tracker.unit) : "",
      pinned,
      target: {
        ...tracker.target,
        value: target === "" ? null : Number(target),
      },
      ...patch,
    });
  }

  return (
    <div className="settings-tracker-row">
      <div className="settings-tracker-line">
        <span className={`tracker-card-kind ${tracker.kind}`}>{tracker.kind}</span>
        <input
          className="settings-tracker-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => commit()}
        />
        <button
          className={`settings-pin ${pinned ? "active" : ""}`}
          onClick={() => { setPinned(!pinned); commit({ pinned: !pinned }); }}
          title={pinned ? "pinned to hero" : "click to pin"}
        >
          {pinned ? "★" : "☆"}
        </button>
        <button className="settings-delete" onClick={onDelete} title="delete tracker">
          ✕
        </button>
      </div>
      <div className="settings-tracker-meta">
        <label className="settings-tracker-target">
          <span className="ob-field-label small">
            {isIntake ? "daily target" : "weekly target"}
          </span>
          <input
            type="number"
            inputMode="numeric"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onBlur={() => commit()}
            placeholder="—"
          />
          <span className="settings-tracker-unit">
            {isIntake ? unit || "amt" : "sessions"}
          </span>
        </label>
        {isIntake && (
          <label className="settings-tracker-target">
            <span className="ob-field-label small">unit</span>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              onBlur={() => commit()}
              placeholder="g"
              className="settings-tracker-unit-input"
            />
          </label>
        )}
      </div>
      {isLegacyMacro && !bannerDismissed && tracker.archivedAt == null && (
        <div className="settings-tracker-banner">
          <span>
            Macro tracking moved to the new Nutrition card. Archive this tracker?
          </span>
          <div className="settings-tracker-banner-actions">
            <button
              className="entry-cancel"
              onClick={() => { dismissBanner(); }}
            >
              keep
            </button>
            <button
              className="entry-submit"
              onClick={() => {
                onUpdate({ archivedAt: new Date().toISOString() });
              }}
            >
              archive
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewTrackerForm({ onCancel, onSubmit }) {
  const [kind, setKind] = useState("workout");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onSubmit({
        kind,
        name: name.trim(),
        unit: kind === "intake" ? (unit.trim() || "g") : "",
        target: {
          period: kind === "intake" ? "daily" : "weekly",
          value: target === "" ? null : Number(target),
          metric: kind === "intake" ? "amount" : "sessions",
        },
        pinned: true,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="settings-new-tracker" onSubmit={save}>
      <div className="settings-new-toggle">
        <button
          type="button"
          onClick={() => setKind("workout")}
          className={`ob-mini-pill ${kind === "workout" ? "active" : ""}`}
        >
          workout
        </button>
        <button
          type="button"
          onClick={() => setKind("intake")}
          className={`ob-mini-pill ${kind === "intake" ? "active" : ""}`}
        >
          intake
        </button>
      </div>
      <input
        className="settings-new-input"
        placeholder={kind === "workout" ? "e.g. Padel" : "e.g. Caffeine"}
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      {kind === "intake" && (
        <input
          className="settings-new-input narrow"
          placeholder="unit"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        />
      )}
      <input
        className="settings-new-input narrow"
        placeholder={kind === "workout" ? "/wk" : "/day"}
        inputMode="numeric"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
      />
      <div className="settings-new-actions">
        <button type="button" className="entry-cancel" onClick={onCancel}>cancel</button>
        <button type="submit" className="entry-submit" disabled={!name.trim() || saving}>
          {saving ? "…" : "add"}
        </button>
      </div>
    </form>
  );
}

/* ---------- Weekly schedule ---------- */
const WEEKDAYS = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
];

function ScheduleSection({ user, updateProfile }) {
  const [draft, setDraft] = useState(() => normalizeSchedule(user?.weeklySchedule));
  const [savedFlash, setSavedFlash] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(normalizeSchedule(user?.weeklySchedule));
  }, [user?._id]);

  async function commit(next) {
    setDraft(next);
    if (saving) return;
    setSaving(true);
    try {
      await updateProfile({ weeklySchedule: next });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="Weekly schedule">
      <p className="settings-section-hint">
        Pick what you train each day. Days marked Rest use rest-day targets.
      </p>
      <div className="settings-schedule">
        {WEEKDAYS.map((d) => (
          <div key={d.id} className="settings-schedule-row">
            <span className="settings-schedule-day">{d.label}</span>
            <input
              type="text"
              className="settings-schedule-input"
              placeholder="rest"
              value={draft[d.id] ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, [d.id]: e.target.value })
              }
              onBlur={() => commit({ ...draft, [d.id]: draft[d.id]?.trim() || null })}
            />
          </div>
        ))}
      </div>
      {savedFlash && <div className="settings-saved-flash">saved</div>}
    </Section>
  );
}

function normalizeSchedule(s) {
  const o = {};
  for (const d of WEEKDAYS) o[d.id] = s?.[d.id] ?? null;
  return o;
}

/* ---------- Targets ---------- */
function TargetsSection({ user, updateProfile }) {
  const [draft, setDraft] = useState(() => ({
    trainingDay: { ...defaultMacro(user?.targets?.trainingDay) },
    restDay:     { ...defaultMacro(user?.targets?.restDay) },
  }));
  const [savedFlash, setSavedFlash] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft({
      trainingDay: defaultMacro(user?.targets?.trainingDay),
      restDay:     defaultMacro(user?.targets?.restDay),
    });
  }, [user?._id]);

  async function commit(next) {
    setDraft(next);
    if (saving) return;
    setSaving(true);
    try {
      await updateProfile({
        targets: {
          trainingDay: toNumbers(next.trainingDay),
          restDay:     toNumbers(next.restDay),
        },
      });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  function setField(dayType, key, value) {
    setDraft((prev) => ({ ...prev, [dayType]: { ...prev[dayType], [key]: value } }));
  }

  function blurCommit() {
    commit(draft);
  }

  return (
    <Section title="Calorie + macro targets">
      <p className="settings-section-hint">
        Used by the Nutrition card. Different day types let you cycle macros
        (e.g. higher carbs on training days).
      </p>

      <TargetGroup
        label="Training day"
        values={draft.trainingDay}
        setField={(k, v) => setField("trainingDay", k, v)}
        onBlur={blurCommit}
      />
      <TargetGroup
        label="Rest day"
        values={draft.restDay}
        setField={(k, v) => setField("restDay", k, v)}
        onBlur={blurCommit}
      />

      {savedFlash && <div className="settings-saved-flash">saved</div>}
    </Section>
  );
}

function TargetGroup({ label, values, setField, onBlur }) {
  return (
    <div className="settings-target-group">
      <div className="settings-target-label">{label}</div>
      <div className="settings-target-grid">
        <TargetCell name="kcal"     value={values.kcal}     setValue={(v) => setField("kcal", v)}     onBlur={onBlur} />
        <TargetCell name="protein"  unit="g" value={values.proteinG} setValue={(v) => setField("proteinG", v)} onBlur={onBlur} />
        <TargetCell name="carbs"    unit="g" value={values.carbsG}   setValue={(v) => setField("carbsG", v)}   onBlur={onBlur} />
        <TargetCell name="fat"      unit="g" value={values.fatG}     setValue={(v) => setField("fatG", v)}     onBlur={onBlur} />
      </div>
    </div>
  );
}

function TargetCell({ name, unit, value, setValue, onBlur }) {
  return (
    <label className="settings-target-cell">
      <span className="ob-field-label small">{name}</span>
      <div className="settings-target-input">
        <input
          type="number"
          inputMode="numeric"
          value={value ?? ""}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
          placeholder="—"
        />
        {unit && <span className="settings-target-unit">{unit}</span>}
      </div>
    </label>
  );
}

function defaultMacro(m) {
  return {
    kcal:     m?.kcal     != null ? String(m.kcal)     : "",
    proteinG: m?.proteinG != null ? String(m.proteinG) : "",
    carbsG:   m?.carbsG   != null ? String(m.carbsG)   : "",
    fatG:     m?.fatG     != null ? String(m.fatG)     : "",
  };
}

function toNumbers(m) {
  const n = (v) => (v === "" || v == null ? null : Number(v));
  return { kcal: n(m.kcal), proteinG: n(m.proteinG), carbsG: n(m.carbsG), fatG: n(m.fatG) };
}

/* ---------- Meal templates ---------- */
const SLOT_LABEL_SHORT = {
  breakfast: "Breakfast", preTraining: "Pre-train", lunch: "Lunch",
  snack: "Snack", dinner: "Dinner", optional: "Optional",
};

function TemplatesSection({ templates, updateTemplate, deleteTemplate }) {
  return (
    <Section title="Meal templates">
      <p className="settings-section-hint">
        One-tap chips on the home screen. Up to 12 can be pinned at once;
        pin/unpin to control which show up.
      </p>
      <div className="settings-template-list">
        {templates.length === 0 && (
          <div className="settings-tracker-empty">
            No templates yet — tick "save as template" when you log a meal.
          </div>
        )}
        {templates.map((t) => (
          <TemplateRow
            key={t._id}
            template={t}
            onUpdate={(body) => updateTemplate(t._id, body)}
            onDelete={() => {
              if (confirm(`Delete template "${t.name}"?`)) deleteTemplate(t._id);
            }}
          />
        ))}
      </div>
    </Section>
  );
}

function TemplateRow({ template, onUpdate, onDelete }) {
  const [name, setName] = useState(template.name);
  const [pinned, setPinned] = useState(template.pinned);

  function commit(patch = {}) {
    onUpdate({
      name: name.trim() || template.name,
      pinned,
      ...patch,
    });
  }

  return (
    <div className="settings-template-row">
      <input
        className="settings-tracker-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => commit()}
      />
      <span className="settings-template-meta">
        <span className="settings-template-slot">{SLOT_LABEL_SHORT[template.mealSlot]}</span>
        <span className="settings-template-macros">
          {template.calories} kcal · {template.proteinG}P {template.carbsG}C {template.fatG}F
        </span>
      </span>
      <button
        className={`settings-pin ${pinned ? "active" : ""}`}
        onClick={() => { setPinned(!pinned); commit({ pinned: !pinned }); }}
        title={pinned ? "pinned" : "click to pin"}
      >
        {pinned ? "★" : "☆"}
      </button>
      <button className="settings-delete" onClick={onDelete} title="delete template">✕</button>
    </div>
  );
}

/* ---------- Account ---------- */
function AccountSection({ signOut, deleteAccount }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleting) return;
    if (!confirm("Delete your account and ALL data? This cannot be undone.")) return;
    if (!confirm("Really? Last chance.")) return;
    setDeleting(true);
    try {
      await deleteAccount();
    } catch (e) {
      alert(e?.message || "Could not delete account");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Section title="Account">
      <div className="settings-account-row">
        <a
          className="settings-link"
          href={api.exportMeURL()}
          target="_blank"
          rel="noreferrer"
        >
          ↓ export my data (JSON)
        </a>
        <button className="settings-link" onClick={signOut}>
          log out
        </button>
      </div>
      <button
        className="settings-danger"
        onClick={handleDelete}
        disabled={deleting}
      >
        {deleting ? "deleting…" : "delete account & all data"}
      </button>
    </Section>
  );
}

/* ---------- helpers ---------- */
function Section({ title, children }) {
  return (
    <section className="settings-section">
      <h3 className="settings-section-title">{title}</h3>
      <div className="settings-section-body">{children}</div>
    </section>
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
        {options.map((opt) => (
          <button
            type="button"
            key={opt.id}
            onClick={() => onChange(value === opt.id ? "" : opt.id)}
            className={`ob-pill ${value === opt.id ? "active" : ""}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
