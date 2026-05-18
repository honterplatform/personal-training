import { useEffect, useMemo, useState } from "react";
import { useStore } from "../lib/store.jsx";
import { api } from "../lib/api.js";
import { weekDays, weekRange } from "../lib/dates.js";
import { XIcon, SparkIcon } from "./Icons.jsx";

const WEEKDAY_LABEL = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export default function WeeklyReview({ onClose }) {
  const { user, weekEntries, nutrition, selectedDate } = useStore();
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
    const target = user?.targets;

    const sessionDays = new Set();
    for (const e of weekEntries) {
      if (!inWeek(e.date)) continue;
      if (e.caloriesBurned || e.durationMin) sessionDays.add(e.date);
    }
    const sessionsDone = sessionDays.size;

    const macroByDay = {};
    for (const m of nutrition) {
      if (!inWeek(m.date)) continue;
      const day = (macroByDay[m.date] ||= { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 });
      day.calories += m.calories || 0;
      day.proteinG += m.proteinG || 0;
      day.carbsG   += m.carbsG   || 0;
      day.fatG     += m.fatG     || 0;
    }
    const daySummaries = days.map((d) => ({
      date: d,
      target,
      totals: macroByDay[d] || { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    }));

    const daysWithMeals = daySummaries.filter((d) => d.totals.calories > 0).length;
    const loggedDays = daySummaries.filter((d) => d.totals.calories > 0);
    const avgKcal = loggedDays.length
      ? loggedDays.reduce((s, d) => s + d.totals.calories, 0) / loggedDays.length
      : 0;
    const avgProtein = loggedDays.length
      ? loggedDays.reduce((s, d) => s + d.totals.proteinG, 0) / loggedDays.length
      : 0;

    return { sessionsDone, daysWithMeals, avgKcal, avgProtein, daySummaries };
  }, [user, weekEntries, nutrition, days, start, end]);

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
            <span className="review-stat-mid"> / 7</span>
            <span className="review-stat-unit"> days with a session</span>
          </div>
          <div className="review-week-grid">
            {weeklyStats.daySummaries.map((d, i) => {
              const sessionLogged = weekEntries.some(
                (e) => e.date === d.date && (e.caloriesBurned || e.durationMin)
              );
              return (
                <div
                  key={d.date}
                  className={`review-day-cell ${sessionLogged ? "logged" : ""}`}
                  title={`${d.date}${sessionLogged ? " · session logged" : ""}`}
                >
                  <div className="review-day-name">{WEEKDAY_LABEL[i]}</div>
                  <div className="review-day-dot">{sessionLogged ? "●" : "○"}</div>
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
      </div>
    </div>
  );
}
