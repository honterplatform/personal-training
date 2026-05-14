import { useState } from "react";
import { useStore } from "../lib/store.jsx";
import { FlameIcon } from "./Icons.jsx";
import LogEntryForm from "./LogEntryForm.jsx";

export default function TrackerCard({ tracker, dayEntries, date }) {
  const { createEntry, deleteEntry } = useStore();
  const [showForm, setShowForm] = useState(false);

  const isWorkout = tracker.kind === "workout";
  const entriesForToday = dayEntries.filter((e) => e.trackerId === tracker._id);

  const summary = computeDaySummary(tracker, entriesForToday);

  async function handleSubmit(body) {
    await createEntry({ trackerId: tracker._id, date, ...body });
    setShowForm(false);
  }

  return (
    <article className="tracker-card">
      <header className="tracker-card-head">
        <div className="tracker-card-name">
          <span className={`tracker-card-kind ${tracker.kind}`}>{tracker.kind}</span>
          {tracker.name}
        </div>
        <div className="tracker-card-summary">{summary}</div>
      </header>

      {entriesForToday.length > 0 && (
        <ul className="entries-list">
          {entriesForToday.map((e) => (
            <li key={e._id} className="entry-row">
              <span className="entry-row-main">
                {isWorkout ? (
                  <>
                    {e.durationMin ? `${e.durationMin} min` : "—"}
                    {e.distanceKm ? ` · ${e.distanceKm} km` : ""}
                    {e.rpe ? ` · RPE ${e.rpe}` : ""}
                  </>
                ) : (
                  <>{e.amount} {tracker.unit}</>
                )}
                {e.notes ? <span className="entry-row-note"> · "{e.notes}"</span> : null}
              </span>
              {e.caloriesBurned ? (
                <span className="entry-row-kcal">
                  <FlameIcon size={11} stroke={2} />
                  {e.caloriesBurned}
                </span>
              ) : null}
              <button
                className="entry-row-del"
                onClick={() => deleteEntry(e._id)}
                aria-label="delete entry"
                title="delete"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {showForm ? (
        <LogEntryForm
          tracker={tracker}
          onCancel={() => setShowForm(false)}
          onSubmit={handleSubmit}
        />
      ) : (
        <button className="tracker-card-add" onClick={() => setShowForm(true)}>
          + log {isWorkout ? "a session" : tracker.name.toLowerCase()}
        </button>
      )}
    </article>
  );
}

function computeDaySummary(tracker, entries) {
  if (entries.length === 0) {
    const target = tracker.target?.value;
    if (tracker.kind === "intake") {
      return `0 / ${target ?? "—"} ${tracker.unit || ""} today`;
    }
    return target ? `${target} sessions/wk target` : "nothing logged today";
  }

  if (tracker.kind === "workout") {
    const totalMin = entries.reduce((s, e) => s + (e.durationMin || 0), 0);
    const totalKcal = entries.reduce((s, e) => s + (e.caloriesBurned || 0), 0);
    return `${entries.length} session${entries.length === 1 ? "" : "s"} · ${totalMin} min${totalKcal ? ` · ${totalKcal} kcal` : ""}`;
  }
  const totalAmt = entries.reduce((s, e) => s + (e.amount || 0), 0);
  const target = tracker.target?.value;
  return `${totalAmt} / ${target ?? "—"} ${tracker.unit || ""} today`;
}
