import { useState } from "react";
import { useStore } from "../lib/store.jsx";
import { isoToDate, todayISO } from "../lib/dates.js";

export default function WeightCard() {
  const { weights, selectedDate, logWeight } = useStore();

  const summary = computeWeightSummary(weights, selectedDate);
  const [adding, setAdding] = useState(false);

  return (
    <section className="weight-card">
      <div className="weight-card-row">
        <div className="weight-card-label">weight</div>

        {summary ? (
          <>
            <div className="weight-card-main">
              <span className="weight-card-avg">{summary.avg7.toFixed(1)}</span>
              <span className="weight-card-unit">kg</span>
              {summary.delta != null && (
                <span
                  className={`weight-card-delta ${summary.deltaDirection}`}
                  title="7-day average vs 14-day average"
                >
                  {summary.delta > 0 ? "↑" : summary.delta < 0 ? "↓" : "→"}{" "}
                  {Math.abs(summary.delta).toFixed(2)}
                </span>
              )}
            </div>
            {summary.todayKg != null && (
              <div className="weight-card-today">today: {summary.todayKg.toFixed(1)} kg</div>
            )}
          </>
        ) : (
          <div className="weight-card-empty">no weights logged yet</div>
        )}

        {!adding && (
          <button className="weight-card-add-btn" onClick={() => setAdding(true)}>
            + log weight
          </button>
        )}
      </div>

      {adding && (
        <WeightForm
          existingToday={summary?.todayKg}
          onCancel={() => setAdding(false)}
          onSubmit={async (kg) => {
            await logWeight({ date: selectedDate, weightKg: kg });
            setAdding(false);
          }}
        />
      )}
    </section>
  );
}

function WeightForm({ existingToday, onCancel, onSubmit }) {
  const [value, setValue] = useState(existingToday != null ? String(existingToday) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    const kg = Number(value);
    if (!Number.isFinite(kg) || kg <= 0) {
      setError("enter a weight in kg");
      return;
    }
    setBusy(true);
    setError(null);
    try { await onSubmit(kg); }
    catch (err) { setError(err?.message || "could not save"); }
    finally { setBusy(false); }
  }

  return (
    <form className="weight-card-form" onSubmit={submit}>
      <input
        type="number"
        inputMode="decimal"
        step="0.1"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="kg"
      />
      {error && <span className="weight-card-error">{error}</span>}
      <button type="button" className="weight-card-cancel" onClick={onCancel}>cancel</button>
      <button type="submit" className="weight-card-save" disabled={busy}>
        {busy ? "…" : "save"}
      </button>
    </form>
  );
}

/**
 * Compute the rolling-average summary for the selected date.
 *  - avg7  : average of weights in the last 7 days (≤ selectedDate)
 *  - avg14 : average of weights in the last 14 days
 *  - delta : avg7 - avg14 (negative = trending down, good during a cut)
 *  - todayKg : weight logged on the selected date, if any
 *
 * Skips days with no weight. Returns null if no weights at all in 14 days.
 */
function computeWeightSummary(weights, selectedDate) {
  if (!weights?.length) return null;

  const selectedDateObj = isoToDate(selectedDate);
  const dayMs = 86_400_000;

  const todayEntry = weights.find((w) => w.date === selectedDate);
  const todayKg = todayEntry ? Number(todayEntry.weightKg) : null;

  const inWindow = (w, days) => {
    const d = isoToDate(w.date);
    const diff = (selectedDateObj.getTime() - d.getTime()) / dayMs;
    return diff >= 0 && diff < days;
  };

  const last7 = weights.filter((w) => inWindow(w, 7));
  const last14 = weights.filter((w) => inWindow(w, 14));
  if (last14.length === 0) return null;

  const avg = (arr) =>
    arr.reduce((s, w) => s + Number(w.weightKg), 0) / arr.length;

  const avg7 = last7.length > 0 ? avg(last7) : avg(last14);
  const avg14 = avg(last14);
  const delta = last7.length >= 3 && last14.length >= last7.length + 2
    ? avg7 - avg14
    : null;

  return {
    avg7,
    avg14,
    delta,
    deltaDirection: delta == null ? "flat" : delta < 0 ? "down" : delta > 0 ? "up" : "flat",
    todayKg,
  };
}
