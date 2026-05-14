import { useState } from "react";

const SUGGESTED_WORKOUTS = [
  { name: "Walking", target: 7 },
  { name: "Running", target: 3 },
  { name: "Gym", target: 3 },
  { name: "Yoga", target: 2 },
  { name: "Pickleball", target: 2 },
  { name: "Cycling", target: 2 },
  { name: "Swimming", target: 2 },
  { name: "Taekwondo", target: 3 },
  { name: "Squash", target: 3 },
  { name: "Climbing", target: 2 },
];

const SUGGESTED_INTAKES = [
  { name: "Protein", unit: "g", target: 150 },
  { name: "Water", unit: "ml", target: 2500 },
  { name: "Magnesium", unit: "mg", target: 400 },
  { name: "Creatine", unit: "g", target: 5 },
  { name: "Sleep", unit: "hrs", target: 8 },
];

export default function TrackersStep({ saving, error, onBack, onSubmit }) {
  // Map id → { kind, name, unit, target, custom? }
  const [picked, setPicked] = useState({});
  const [customName, setCustomName] = useState("");
  const [customKind, setCustomKind] = useState("workout");
  const [customUnit, setCustomUnit] = useState("");
  const [customTarget, setCustomTarget] = useState("");

  function toggle(id, base) {
    setPicked((prev) => {
      if (prev[id]) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: { ...base } };
    });
  }

  function setTarget(id, value) {
    setPicked((prev) => ({ ...prev, [id]: { ...prev[id], target: value } }));
  }

  function setUnit(id, unit) {
    setPicked((prev) => ({ ...prev, [id]: { ...prev[id], unit } }));
  }

  function addCustom() {
    const name = customName.trim();
    if (!name) return;
    const id = `custom-${Date.now()}`;
    setPicked((prev) => ({
      ...prev,
      [id]: {
        kind: customKind,
        name,
        unit: customKind === "intake" ? (customUnit.trim() || "g") : "",
        target: customTarget,
        custom: true,
      },
    }));
    setCustomName("");
    setCustomUnit("");
    setCustomTarget("");
  }

  function removeItem(id) {
    setPicked((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }

  const pickedCount = Object.keys(picked).length;

  async function submit(e) {
    e.preventDefault();
    if (saving || pickedCount === 0) return;
    const trackers = Object.values(picked).map((p) => ({
      kind: p.kind,
      name: p.name,
      unit: p.unit || "",
      target: {
        period: p.kind === "intake" ? "daily" : "weekly",
        value: p.target === "" || p.target == null ? null : Number(p.target),
        metric: p.kind === "intake" ? "amount" : "sessions",
      },
      pinned: true,
    }));
    onSubmit(trackers);
  }

  return (
    <form className="onboarding-step" onSubmit={submit}>
      <div className="onboarding-eyebrow">step 2 of 2</div>
      <h1 className="onboarding-title">what do you want to track?</h1>
      <p className="onboarding-sub">
        Pick anything — the AI estimates calories from the activity name and your
        body. You can add, edit, or remove trackers any time.
      </p>

      <section className="ob-section">
        <div className="ob-section-label">workouts · weekly target</div>
        <div className="ob-suggest-grid">
          {SUGGESTED_WORKOUTS.map((s) => {
            const id = `w-${s.name}`;
            const isPicked = !!picked[id];
            return (
              <button
                type="button"
                key={id}
                className={`ob-suggest ${isPicked ? "picked" : ""}`}
                onClick={() =>
                  toggle(id, {
                    kind: "workout",
                    name: s.name,
                    unit: "",
                    target: s.target,
                  })
                }
              >
                {s.name}
                {isPicked ? <span className="ob-suggest-check">✓</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="ob-section">
        <div className="ob-section-label">intake · daily target</div>
        <div className="ob-suggest-grid">
          {SUGGESTED_INTAKES.map((s) => {
            const id = `i-${s.name}`;
            const isPicked = !!picked[id];
            return (
              <button
                type="button"
                key={id}
                className={`ob-suggest ${isPicked ? "picked" : ""}`}
                onClick={() =>
                  toggle(id, {
                    kind: "intake",
                    name: s.name,
                    unit: s.unit,
                    target: s.target,
                  })
                }
              >
                {s.name}
                {isPicked ? <span className="ob-suggest-check">✓</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="ob-section">
        <div className="ob-section-label">add something custom</div>
        <div className="ob-custom-row">
          <div className="ob-custom-toggle">
            <button
              type="button"
              onClick={() => setCustomKind("workout")}
              className={`ob-mini-pill ${customKind === "workout" ? "active" : ""}`}
            >
              workout
            </button>
            <button
              type="button"
              onClick={() => setCustomKind("intake")}
              className={`ob-mini-pill ${customKind === "intake" ? "active" : ""}`}
            >
              intake
            </button>
          </div>
          <input
            className="ob-custom-input"
            placeholder={customKind === "workout" ? "e.g. Padel, Surf" : "e.g. Caffeine, Steps"}
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
          {customKind === "intake" && (
            <input
              className="ob-custom-input narrow"
              placeholder="unit"
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
            />
          )}
          <input
            className="ob-custom-input narrow"
            placeholder="target"
            inputMode="numeric"
            value={customTarget}
            onChange={(e) => setCustomTarget(e.target.value)}
          />
          <button
            type="button"
            className="ob-custom-add"
            onClick={addCustom}
            disabled={!customName.trim()}
          >
            add
          </button>
        </div>
      </section>

      {pickedCount > 0 && (
        <section className="ob-section">
          <div className="ob-section-label">your picks ({pickedCount})</div>
          <div className="ob-picks">
            {Object.entries(picked).map(([id, p]) => (
              <div key={id} className="ob-pick-row">
                <div className="ob-pick-name">
                  <span className={`ob-pick-kind ${p.kind}`}>{p.kind}</span>
                  {p.name}
                </div>
                <div className="ob-pick-target">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={p.target ?? ""}
                    onChange={(e) => setTarget(id, e.target.value)}
                    placeholder={p.kind === "workout" ? "/wk" : "/day"}
                  />
                  <span className="ob-pick-target-unit">
                    {p.kind === "intake" ? p.unit || "amt" : "/wk"}
                  </span>
                  {p.kind === "intake" && p.custom ? (
                    <input
                      type="text"
                      className="ob-pick-unit"
                      value={p.unit ?? ""}
                      onChange={(e) => setUnit(id, e.target.value)}
                      placeholder="unit"
                    />
                  ) : null}
                </div>
                <button type="button" className="ob-pick-remove" onClick={() => removeItem(id)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {error && <div className="onboarding-error">{error}</div>}

      <div className="ob-step-actions">
        <button type="button" className="onboarding-back" onClick={onBack} disabled={saving}>
          ← back
        </button>
        <button
          type="submit"
          className="onboarding-next"
          disabled={saving || pickedCount === 0}
        >
          {saving ? "saving…" : `start logging (${pickedCount})`}
        </button>
      </div>
    </form>
  );
}
