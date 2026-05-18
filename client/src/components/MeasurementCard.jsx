import { useState } from "react";
import { useStore } from "../lib/store.jsx";
import { isoToDate } from "../lib/dates.js";

export default function MeasurementCard() {
  const { measurements, selectedDate, logMeasurement } = useStore();
  const [adding, setAdding] = useState(false);

  const summary = computeMeasurementSummary(measurements, selectedDate);

  return (
    <section className="measurement-card">
      <div className="measurement-card-row">
        <div className="measurement-card-label">waist</div>

        {summary?.latest ? (
          <>
            <div className="measurement-card-main">
              <span className="measurement-card-value">
                {summary.latest.waistCm != null ? summary.latest.waistCm.toFixed(1) : "—"}
              </span>
              <span className="measurement-card-unit">cm</span>
              {summary.waistDelta28 != null && (
                <span
                  className={`measurement-card-delta ${summary.waistDelta28 < 0 ? "down" : "up"}`}
                  title="vs ~28 days ago"
                >
                  {summary.waistDelta28 > 0 ? "↑" : summary.waistDelta28 < 0 ? "↓" : "→"}{" "}
                  {Math.abs(summary.waistDelta28).toFixed(1)} <span className="period">28d</span>
                </span>
              )}
            </div>
            <div className="measurement-card-sub">
              {summary.latest.neckCm != null && (
                <span>neck {summary.latest.neckCm.toFixed(1)}</span>
              )}
              {summary.latest.hipCm != null && (
                <span>hip {summary.latest.hipCm.toFixed(1)}</span>
              )}
              <span className="measurement-card-date">
                {relativeDayLabel(summary.latest.date, selectedDate)}
              </span>
            </div>
          </>
        ) : (
          <div className="measurement-card-empty">no measurements logged</div>
        )}

        {!adding && (
          <button className="measurement-card-add-btn" onClick={() => setAdding(true)}>
            + log waist
          </button>
        )}
      </div>

      {adding && (
        <MeasurementForm
          existing={summary?.todayEntry}
          onCancel={() => setAdding(false)}
          onSubmit={async (body) => {
            await logMeasurement({ date: selectedDate, ...body });
            setAdding(false);
          }}
        />
      )}
    </section>
  );
}

function MeasurementForm({ existing, onCancel, onSubmit }) {
  const [waist, setWaist] = useState(existing?.waistCm != null ? String(existing.waistCm) : "");
  const [neck,  setNeck]  = useState(existing?.neckCm  != null ? String(existing.neckCm)  : "");
  const [hip,   setHip]   = useState(existing?.hipCm   != null ? String(existing.hipCm)   : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    const body = {};
    body.waistCm = parsePos(waist);
    body.neckCm  = parsePos(neck);
    body.hipCm   = parsePos(hip);
    if (body.waistCm == null && body.neckCm == null && body.hipCm == null) {
      setError("enter at least one measurement");
      return;
    }
    setBusy(true);
    setError(null);
    try { await onSubmit(body); }
    catch (err) { setError(err?.message || "could not save"); }
    finally { setBusy(false); }
  }

  return (
    <form className="measurement-card-form" onSubmit={submit}>
      <NumInput label="waist" value={waist} onChange={setWaist} autoFocus />
      <NumInput label="neck"  value={neck}  onChange={setNeck} />
      <NumInput label="hip"   value={hip}   onChange={setHip} />
      {error && <span className="measurement-card-error">{error}</span>}
      <div className="measurement-card-form-actions">
        <button type="button" className="measurement-card-cancel" onClick={onCancel}>cancel</button>
        <button type="submit" className="measurement-card-save" disabled={busy}>
          {busy ? "…" : "save"}
        </button>
      </div>
    </form>
  );
}

function NumInput({ label, value, onChange, autoFocus }) {
  return (
    <label className="measurement-input">
      <span>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="cm"
        autoFocus={autoFocus}
      />
    </label>
  );
}

function parsePos(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function relativeDayLabel(iso, refIso) {
  const ref = isoToDate(refIso).getTime();
  const d = isoToDate(iso).getTime();
  const days = Math.round((ref - d) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 0) return iso;
  return `${days}d ago`;
}

function computeMeasurementSummary(list, selectedDate) {
  if (!list?.length) return null;

  const refMs = isoToDate(selectedDate).getTime();
  const onOrBefore = list.filter((m) => isoToDate(m.date).getTime() <= refMs);
  if (onOrBefore.length === 0) return null;

  const sorted = [...onOrBefore].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const todayEntry = list.find((m) => m.date === selectedDate) || null;

  let waistDelta28 = null;
  if (latest.waistCm != null) {
    const target = refMs - 28 * 86_400_000;
    let baseline = null;
    let bestDiff = Infinity;
    for (const m of sorted) {
      if (m.waistCm == null) continue;
      const diff = Math.abs(isoToDate(m.date).getTime() - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        baseline = m;
      }
    }
    if (baseline && baseline._id !== latest._id && bestDiff < 14 * 86_400_000) {
      waistDelta28 = latest.waistCm - baseline.waistCm;
    }
  }

  return { latest, todayEntry, waistDelta28 };
}
