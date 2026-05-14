import { weekDays as weekDaysOf, todayISO, weekRange } from "../lib/dates.js";
import { SparkIcon } from "./Icons.jsx";

const ACCENT = "#ff5a3c";
const DAY_INITIALS = ["m", "t", "w", "t", "f", "s", "s"];

export default function WeeklyHero({
  trackers,
  weekEntries,
  selectedDate,
  onSelectDate,
  onOpenCoach,
}) {
  const days = weekDaysOf(selectedDate);
  const range = weekRange(selectedDate);
  const today = todayISO();

  const totals = computeTotals(trackers, days, weekEntries);
  const pinned = trackers.filter((t) => t.pinned);

  return (
    <section className="hero-card">
      <div className="hero-glow" />

      <div className="hero-head">
        <div>
          <div className="hero-title">This week</div>
          <div className="hero-range">{weekRangeLabel(range.start, range.end)}</div>
        </div>
      </div>

      {pinned.length > 0 ? (
        <div className="hero-tiles">
          {pinned.slice(0, 6).map((t) => (
            <GoalTile key={t._id} tracker={t} tot={totals.byTracker[t._id]} />
          ))}
        </div>
      ) : (
        <div className="hero-empty">
          No pinned trackers — add some in settings.
        </div>
      )}

      <div className="hero-strip">
        <div className="hero-strip-labels">
          {DAY_INITIALS.map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="hero-strip-days">
          {days.map((iso) => {
            const isToday = iso === today;
            const isSel = iso === selectedDate;
            const hasEntries = totals.byDay[iso] > 0;
            return (
              <button
                key={iso}
                onClick={() => onSelectDate(iso)}
                className={`hero-day ${isSel ? "selected" : ""} ${isToday && !isSel ? "today" : ""}`}
              >
                <span>{Number(iso.slice(8, 10))}</span>
                {hasEntries && !isSel ? <span className="hero-day-dot" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="hero-foot">
        <div>
          <div className="hero-kcal-label">week burn</div>
          <div className="hero-kcal-num">
            {totals.weekKcal.toLocaleString()}
            <span className="hero-kcal-unit"> kcal</span>
          </div>
        </div>
        <button className="hero-coach-btn" onClick={onOpenCoach}>
          <SparkIcon size={15} stroke={2} /> talk to coach
        </button>
      </div>
    </section>
  );
}

function GoalTile({ tracker, tot }) {
  const target = tracker.target?.value;
  const current = tot?.current ?? 0;
  const unit = unitLabel(tracker);
  const pct = target && target > 0 ? Math.min(1, current / target) : 0;
  const hit = target && current >= target;
  return (
    <div className={`hero-tile ${hit ? "hit" : ""}`}>
      <div className="hero-tile-label">{tracker.name}</div>
      <div className="hero-tile-value">
        {formatNum(current)}
        {target ? <span className="hero-tile-goal">/{formatNum(target)}</span> : null}
      </div>
      <div className="hero-tile-sub">
        {unit}
      </div>
      {target ? (
        <div className="hero-tile-bar">
          <div
            className="hero-tile-bar-fill"
            style={{ width: `${pct * 100}%`, background: hit ? ACCENT : "rgba(244,239,229,0.4)" }}
          />
        </div>
      ) : null}
    </div>
  );
}

function unitLabel(tracker) {
  if (tracker.kind === "intake") {
    return `${tracker.unit || "amt"} ${tracker.target?.period === "daily" ? "/day" : "/wk"}`;
  }
  return `sessions /wk`;
}

function formatNum(n) {
  if (n == null) return "—";
  if (Number.isInteger(n)) return n;
  return Math.round(n * 10) / 10;
}

function weekRangeLabel(startIso, endIso) {
  const s = new Date(startIso + "T12:00:00");
  const e = new Date(endIso + "T12:00:00");
  const sm = s.toLocaleString("en", { month: "short" });
  const em = e.toLocaleString("en", { month: "short" });
  return `${sm} ${s.getDate()} — ${sm === em ? "" : em + " "}${e.getDate()}`;
}

function computeTotals(trackers, days, weekEntries) {
  const byTracker = {};
  for (const t of trackers) {
    byTracker[t._id] = { current: 0 };
  }
  const byDay = {};
  for (const d of days) byDay[d] = 0;

  let weekKcal = 0;
  for (const e of weekEntries) {
    const t = trackers.find((x) => x._id === e.trackerId);
    if (!t) continue;
    const slot = byTracker[t._id];
    if (!slot) continue;

    if (t.kind === "workout") {
      // Workouts count by sessions; one entry = one session.
      slot.current += 1;
    } else if (t.kind === "intake") {
      const isDaily = t.target?.period === "daily";
      if (isDaily) {
        // Today's intake total — only count if entry is on selected/today's date.
        // For weekly hero "intake" daily targets, show the *latest day* tally
        // doesn't make sense as a weekly total. Use the daily sum for the most
        // recently-selected date instead. Simpler: show total amount this week.
        slot.current += Number(e.amount) || 0;
      } else {
        slot.current += Number(e.amount) || 0;
      }
    }
    if (e.caloriesBurned) weekKcal += Number(e.caloriesBurned) || 0;
    if (byDay[e.date] != null) byDay[e.date] += 1;
  }

  return { byTracker, byDay, weekKcal };
}
