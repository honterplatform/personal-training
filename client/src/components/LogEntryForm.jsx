import { useState } from "react";

const DISTANCE_RE = /\b(walk|run|jog|cycl|bik|hik|swim|row|ski|skat)/i;
function tracksDistance(tracker) {
  return tracker.kind === "workout" && DISTANCE_RE.test(tracker.name);
}

export default function LogEntryForm({ tracker, onCancel, onSubmit }) {
  const isWorkout = tracker.kind === "workout";
  const showDistance = tracksDistance(tracker);
  const [durationMin, setDurationMin] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [rpe, setRpe] = useState(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const body = { notes: notes.trim() };
      if (isWorkout) {
        if (!durationMin || Number(durationMin) <= 0) {
          throw new Error("duration required");
        }
        body.durationMin = Number(durationMin);
        if (showDistance) {
          body.distanceKm = distanceKm === "" ? null : Number(distanceKm);
        }
        body.rpe = rpe;
      } else {
        if (!amount || Number(amount) <= 0) {
          throw new Error("amount required");
        }
        body.amount = Number(amount);
      }
      await onSubmit(body);
    } catch (e) {
      setError(e?.message || "Could not save");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="entry-form" onSubmit={submit}>
      {isWorkout ? (
        <>
          <div className="entry-fields-row">
            <Field label="duration" unit="min">
              <input
                type="number"
                inputMode="numeric"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                placeholder="60"
                autoFocus
              />
            </Field>
            {showDistance && (
              <Field label="distance" unit="km" optional>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  placeholder="—"
                />
              </Field>
            )}
          </div>

          <div className="entry-rpe">
            <div className="entry-rpe-head">
              <span className="ob-field-label">RPE</span>
              <span className="entry-rpe-value">
                {rpe ? `${rpe}/10` : "tap to rate"}
              </span>
            </div>
            <div className="entry-rpe-grid">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                const active = (rpe ?? 0) >= n;
                return (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setRpe(rpe === n ? null : n)}
                    className={`entry-rpe-cell ${active ? "active" : ""}`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <div className="entry-rpe-gloss">
              How hard it felt. 1 = barely moving, 5 = conversational, 7 = breathing hard, 10 = all-out.
            </div>
          </div>
        </>
      ) : (
        <Field label={`amount`} unit={tracker.unit || ""}>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            autoFocus
          />
        </Field>
      )}

      <Field label="notes" optional>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="how did it feel?"
          rows={2}
        />
      </Field>

      {error && <div className="onboarding-error">{error}</div>}

      <div className="entry-form-actions">
        <button type="button" className="entry-cancel" onClick={onCancel}>
          cancel
        </button>
        <button type="submit" className="entry-submit" disabled={submitting}>
          {submitting ? "saving…" : "log it"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, unit, optional, children }) {
  return (
    <label className="ob-field">
      <span className="ob-field-label">
        {label} {optional ? <span className="optional">· optional</span> : null}
      </span>
      <div className="ob-field-input">
        {children}
        {unit ? <span className="ob-field-unit">{unit}</span> : null}
      </div>
    </label>
  );
}
