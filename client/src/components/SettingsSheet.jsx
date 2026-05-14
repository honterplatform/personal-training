import { useEffect, useState } from "react";
import { useStore } from "../lib/store.jsx";
import { api } from "../lib/api.js";
import { XIcon } from "./Icons.jsx";

export default function SettingsSheet({ onClose }) {
  const {
    user, trackers, updateProfile, createTracker, updateTracker, deleteTracker,
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
          <TrackersSection
            trackers={trackers}
            createTracker={createTracker}
            updateTracker={updateTracker}
            deleteTracker={deleteTracker}
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

function TrackerRow({ tracker, onUpdate, onDelete }) {
  const [name, setName] = useState(tracker.name);
  const [unit, setUnit] = useState(tracker.unit || "");
  const [target, setTarget] = useState(
    tracker.target?.value != null ? String(tracker.target.value) : ""
  );
  const [pinned, setPinned] = useState(tracker.pinned);

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
