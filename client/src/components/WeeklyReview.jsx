import { useEffect, useMemo, useState } from "react";
import { useStore } from "../lib/store.jsx";
import { api } from "../lib/api.js";
import { apiBaseURL } from "../lib/api.js";
import { weekDays, weekRange, isoToDate } from "../lib/dates.js";
import { dayTypeFor, targetFor } from "../lib/dayType.js";
import { XIcon, SparkIcon } from "./Icons.jsx";

const WEEKDAY_LABEL = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export default function WeeklyReview({ onClose }) {
  const { user, weekEntries, nutrition, weights, measurements, photos, selectedDate } = useStore();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await api.coachReview(selectedDate);
        if (!cancelled) setSummary(r.summary);
      } catch (e) {
        if (!cancelled) setError(e?.message || "couldn't load review");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedDate]);

  const days = useMemo(() => weekDays(selectedDate), [selectedDate]);
  const { start, end } = useMemo(() => weekRange(selectedDate), [selectedDate]);

  const weeklyStats = useMemo(() => {
    const inWeek = (iso) => iso >= start && iso <= end;

    // Training: count entries with caloriesBurned or durationMin per day
    const sessionDays = new Set();
    for (const e of weekEntries) {
      if (!inWeek(e.date)) continue;
      if (e.caloriesBurned || e.durationMin) sessionDays.add(e.date);
    }
    const trainingDays = days.filter((d) => dayTypeFor(user, d) === "training").length;
    const sessionsDone = sessionDays.size;

    // Macros adherence per day
    const macroByDay = {};
    for (const m of nutrition) {
      if (!inWeek(m.date)) continue;
      const day = (macroByDay[m.date] ||= { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 });
      day.calories += m.calories || 0;
      day.proteinG += m.proteinG || 0;
      day.carbsG   += m.carbsG   || 0;
      day.fatG     += m.fatG     || 0;
    }
    const daySummaries = days.map((d) => {
      const t = targetFor(user, d);
      const totals = macroByDay[d] || { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
      return { date: d, type: dayTypeFor(user, d), target: t, totals };
    });

    // Logged-meal days (any meal logged at all)
    const daysWithMeals = daySummaries.filter((d) => d.totals.calories > 0).length;

    // Average actual kcal across days that have any meals logged
    const loggedDays = daySummaries.filter((d) => d.totals.calories > 0);
    const avgKcal = loggedDays.length
      ? loggedDays.reduce((s, d) => s + d.totals.calories, 0) / loggedDays.length
      : 0;
    const avgProtein = loggedDays.length
      ? loggedDays.reduce((s, d) => s + d.totals.proteinG, 0) / loggedDays.length
      : 0;

    return {
      sessionsDone,
      trainingDays,
      daysWithMeals,
      avgKcal,
      avgProtein,
      daySummaries,
    };
  }, [user, weekEntries, nutrition, days, start, end]);

  const weightTrend = useMemo(() => {
    const ws = [...weights].filter((w) => isoToDate(w.date).getTime() <= isoToDate(end).getTime());
    if (ws.length < 2) return null;
    ws.sort((a, b) => a.date.localeCompare(b.date));
    const last = ws[ws.length - 1];
    const ref = isoToDate(last.date).getTime() - 7 * 86_400_000;
    let baseline = ws[0];
    for (const w of ws) {
      if (isoToDate(w.date).getTime() <= ref) baseline = w;
    }
    return {
      latest: Number(last.weightKg),
      baseline: Number(baseline.weightKg),
      delta: Number(last.weightKg) - Number(baseline.weightKg),
      series: ws.slice(-21).map((w) => Number(w.weightKg)),
    };
  }, [weights, end]);

  const waistTrend = useMemo(() => {
    const ms = measurements
      .filter((m) => m.waistCm != null && isoToDate(m.date).getTime() <= isoToDate(end).getTime())
      .sort((a, b) => a.date.localeCompare(b.date));
    if (ms.length < 2) return null;
    const latest = ms[ms.length - 1];
    const ref = isoToDate(latest.date).getTime() - 28 * 86_400_000;
    let baseline = ms[0];
    let bestDiff = Math.abs(isoToDate(ms[0].date).getTime() - ref);
    for (const m of ms) {
      const d = Math.abs(isoToDate(m.date).getTime() - ref);
      if (d < bestDiff) { baseline = m; bestDiff = d; }
    }
    if (baseline === latest) return null;
    return {
      latest: latest.waistCm,
      baseline: baseline.waistCm,
      delta: latest.waistCm - baseline.waistCm,
      baselineDate: baseline.date,
      latestDate: latest.date,
    };
  }, [measurements, end]);

  const photoPair = useMemo(() => {
    if (!photos?.length) return null;
    const sorted = [...photos].sort((a, b) => a.date.localeCompare(b.date));
    const byAngle = {};
    for (const p of sorted) (byAngle[p.angle] ||= []).push(p);
    const front = byAngle.front || byAngle.side || byAngle.back;
    if (!front || front.length < 1) return null;
    const latest = front[front.length - 1];
    const earliest = front[0];
    if (earliest._id === latest._id) return { earliest: null, latest };
    return { earliest, latest };
  }, [photos]);

  return (
    <div className="weekly-review">
      <div className="weekly-review-inner">
        <header className="weekly-review-head">
          <div>
            <div className="weekly-review-eyebrow">weekly review</div>
            <div className="weekly-review-range">{start} → {end}</div>
          </div>
          <button onClick={onClose} className="weekly-review-close" aria-label="close">
            <XIcon size={16} />
          </button>
        </header>

        <section className="review-summary">
          <div className="review-summary-head">
            <SparkIcon size={14} />
            <span>coach summary</span>
          </div>
          {loading ? (
            <div className="review-summary-loading">thinking…</div>
          ) : error ? (
            <div className="review-summary-error">{error}</div>
          ) : (
            <div className="review-summary-body">{summary}</div>
          )}
        </section>

        <section className="review-block">
          <div className="review-block-label">training</div>
          <div className="review-block-stat">
            <span className="review-stat-big">{weeklyStats.sessionsDone}</span>
            <span className="review-stat-mid"> / {weeklyStats.trainingDays}</span>
            <span className="review-stat-unit"> sessions on training days</span>
          </div>
          <div className="review-week-grid">
            {weeklyStats.daySummaries.map((d, i) => {
              const sessionLogged = weekEntries.some(
                (e) => e.date === d.date && (e.caloriesBurned || e.durationMin)
              );
              return (
                <div
                  key={d.date}
                  className={`review-day-cell ${d.type} ${sessionLogged ? "logged" : ""}`}
                  title={`${d.date} · ${d.type}${sessionLogged ? " · session logged" : ""}`}
                >
                  <div className="review-day-name">{WEEKDAY_LABEL[i]}</div>
                  <div className="review-day-dot">{sessionLogged ? "●" : d.type === "training" ? "○" : ""}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="review-block">
          <div className="review-block-label">nutrition</div>
          <div className="review-block-stat">
            <span className="review-stat-big">{weeklyStats.daysWithMeals}</span>
            <span className="review-stat-mid"> / 7</span>
            <span className="review-stat-unit"> days logged</span>
          </div>
          {weeklyStats.daysWithMeals > 0 && (
            <div className="review-macros-row">
              <span>avg <strong>{Math.round(weeklyStats.avgKcal)}</strong> kcal/day</span>
              <span>·</span>
              <span>avg <strong>{Math.round(weeklyStats.avgProtein)}</strong>g protein</span>
            </div>
          )}
          <div className="review-macro-grid">
            {weeklyStats.daySummaries.map((d, i) => {
              const pct = d.target?.kcal
                ? Math.min(1, d.totals.calories / d.target.kcal)
                : 0;
              return (
                <div key={d.date} className="review-macro-cell" title={`${d.date}: ${d.totals.calories} / ${d.target?.kcal || "?"} kcal`}>
                  <div className="review-macro-track">
                    <div
                      className={`review-macro-fill ${pct >= 0.85 ? "good" : pct >= 0.5 ? "mid" : "low"}`}
                      style={{ height: `${pct * 100}%` }}
                    />
                  </div>
                  <div className="review-macro-label">{WEEKDAY_LABEL[i]}</div>
                </div>
              );
            })}
          </div>
        </section>

        {weightTrend && (
          <section className="review-block">
            <div className="review-block-label">weight</div>
            <div className="review-block-stat">
              <span className="review-stat-big">{weightTrend.latest.toFixed(1)}</span>
              <span className="review-stat-unit"> kg</span>
              <span className={`review-stat-delta ${weightTrend.delta < 0 ? "down" : "up"}`}>
                {weightTrend.delta > 0 ? "+" : ""}{weightTrend.delta.toFixed(2)} vs 7d
              </span>
            </div>
            <Sparkline points={weightTrend.series} />
          </section>
        )}

        {waistTrend && (
          <section className="review-block">
            <div className="review-block-label">waist</div>
            <div className="review-block-stat">
              <span className="review-stat-big">{waistTrend.latest.toFixed(1)}</span>
              <span className="review-stat-unit"> cm</span>
              <span className={`review-stat-delta ${waistTrend.delta < 0 ? "down" : "up"}`}>
                {waistTrend.delta > 0 ? "+" : ""}{waistTrend.delta.toFixed(1)} vs {waistTrend.baselineDate}
              </span>
            </div>
          </section>
        )}

        {photoPair && (
          <section className="review-block">
            <div className="review-block-label">progress</div>
            <div className="review-photo-pair">
              {photoPair.earliest && (
                <figure>
                  <img src={`${apiBaseURL}${photoPair.earliest.url}`} alt="earliest" />
                  <figcaption>{photoPair.earliest.date}</figcaption>
                </figure>
              )}
              <figure>
                <img src={`${apiBaseURL}${photoPair.latest.url}`} alt="latest" />
                <figcaption>{photoPair.latest.date}</figcaption>
              </figure>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Sparkline({ points }) {
  if (!points || points.length < 2) return null;
  const w = 280;
  const h = 40;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  const d = points.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * h;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg className="review-sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
