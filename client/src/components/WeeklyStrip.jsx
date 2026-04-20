import { weekDays as weekDaysOf, todayISO } from "../lib/dates.js";
import { SparkIcon } from "./Icons.jsx";

const ACCENT = "#ff5a3c";
const DAY_SHORT = ["m", "t", "w", "t", "f", "s", "s"];

export default function WeeklyStrip({ selectedDate, weekEntries, onSelectDate, summary, summaryOpen, summaryLoading, onSummaryToggle }) {
  const days = weekDaysOf(selectedDate);
  const today = todayISO();
  const totals = computeTotals(days, weekEntries);

  return (
    <div
      style={{
        background: "#17140f",
        borderRadius: 28,
        padding: "22px 22px 18px",
        color: "#f4efe5",
        position: "relative",
        overflow: "hidden",
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.04) inset, 0 14px 30px -12px rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${ACCENT}33 0%, transparent 60%)`,
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative" }}>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontStyle: "italic",
            fontSize: 32,
            lineHeight: 1,
            letterSpacing: -0.5,
            whiteSpace: "nowrap",
          }}
        >
          This week
        </div>
        <div
          style={{
            fontSize: 12,
            color: "rgba(244,239,229,0.5)",
            marginTop: 6,
            fontFamily: "var(--mono)",
            letterSpacing: 0.3,
            whiteSpace: "nowrap",
          }}
        >
          {weekRangeLabel(days[0], days[6])}
        </div>
        <div style={{ position: "absolute", top: 2, right: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(244,239,229,0.35)" }} />
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(244,239,229,0.35)" }} />
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(244,239,229,0.35)" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8, marginTop: 22 }}>
        <GoalTile label="walk" cur={totals.walkDays} goal={7} sub={`${totals.walkKm.toFixed(1)}/42 km`} />
        <GoalTile label="squash" cur={totals.squashDays} goal={3} />
        <GoalTile label="tkd" cur={totals.tkdDays} goal={3} />
        <GoalTile label="strength" cur={totals.strengthDays} goal={1} />
        <GoalTile label="protein" cur={totals.proteinDays} goal={7} />
      </div>

      <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(244,239,229,0.08)" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
            fontSize: 11,
            color: "rgba(244,239,229,0.4)",
            textAlign: "center",
            marginBottom: 10,
            fontFamily: "var(--mono)",
            textTransform: "lowercase",
            letterSpacing: 0.5,
          }}
        >
          {DAY_SHORT.map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {days.map((iso) => {
            const isToday = iso === today;
            const isSel = iso === selectedDate;
            const completion = totals.byDay[iso] || 0;
            return (
              <button
                key={iso}
                onClick={() => onSelectDate(iso)}
                style={{
                  aspectRatio: "1",
                  borderRadius: "50%",
                  background: isSel ? ACCENT : "rgba(244,239,229,0.06)",
                  color: isSel ? "#17140f" : isToday ? "#f4efe5" : "rgba(244,239,229,0.75)",
                  border: isToday && !isSel ? "1px solid rgba(244,239,229,0.4)" : "1px solid transparent",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: -0.3,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 160ms",
                }}
              >
                {parseInt(iso.slice(8, 10), 10)}
                {!isSel && completion > 0 && (
                  <svg viewBox="0 0 36 36" style={{ position: "absolute", inset: -1, pointerEvents: "none" }}>
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke={ACCENT}
                      strokeWidth="2"
                      strokeDasharray={`${completion * 100.5} 101`}
                      strokeLinecap="round"
                      transform="rotate(-90 18 18)"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          paddingTop: 16,
          borderTop: "1px solid rgba(244,239,229,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: "rgba(244,239,229,0.45)",
              letterSpacing: 0.4,
              textTransform: "uppercase",
              fontFamily: "var(--mono)",
            }}
          >
            week burn
          </div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 34, lineHeight: 1, marginTop: 4, letterSpacing: -0.5 }}>
            {totals.calories.toLocaleString()}
            <span style={{ fontSize: 14, fontFamily: "var(--sans)", color: "rgba(244,239,229,0.5)", marginLeft: 4, letterSpacing: 0 }}>
              kcal
            </span>
          </div>
        </div>
        <button
          onClick={onSummaryToggle}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            borderRadius: 999,
            background: summaryOpen ? ACCENT : "rgba(244,239,229,0.08)",
            color: summaryOpen ? "#17140f" : "#f4efe5",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: -0.1,
            border: "1px solid rgba(244,239,229,0.08)",
          }}
        >
          <SparkIcon size={15} /> coach
        </button>
      </div>

      {summaryOpen && (
        <div
          style={{
            marginTop: 14,
            padding: "14px 16px",
            background: "rgba(244,239,229,0.05)",
            borderRadius: 18,
            border: "1px solid rgba(244,239,229,0.08)",
            fontSize: 13.5,
            lineHeight: 1.55,
            color: "rgba(244,239,229,0.85)",
          }}
        >
          {summaryLoading ? (
            <div style={{ color: "rgba(244,239,229,0.5)" }}>
              <span className="log-blink">●</span> generating coach summary…
            </div>
          ) : (
            summary || "Tap coach again to generate a summary."
          )}
        </div>
      )}
    </div>
  );
}

function GoalTile({ label, cur, goal, sub }) {
  const pct = Math.min(1, cur / goal);
  const done = cur >= goal;
  return (
    <div
      style={{
        background: "rgba(244,239,229,0.05)",
        border: "1px solid rgba(244,239,229,0.06)",
        borderRadius: 14,
        padding: "10px 8px 8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        minHeight: sub ? 72 : 62,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "rgba(244,239,229,0.45)",
          textTransform: "uppercase",
          letterSpacing: 0.6,
          fontFamily: "var(--mono)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginTop: 2,
          color: done ? ACCENT : "#f4efe5",
          letterSpacing: -0.4,
        }}
      >
        {cur}
        <span style={{ color: "rgba(244,239,229,0.35)", fontWeight: 500 }}>/{goal}</span>
      </div>
      {sub && (
        <div style={{ fontSize: 9.5, color: "rgba(244,239,229,0.4)", marginTop: 1, fontFamily: "var(--mono)" }}>
          {sub}
        </div>
      )}
      <div
        style={{
          marginTop: "auto",
          width: "100%",
          height: 3,
          background: "rgba(244,239,229,0.08)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct * 100}%`,
            height: "100%",
            background: done ? ACCENT : "rgba(244,239,229,0.4)",
            transition: "width 300ms",
          }}
        />
      </div>
    </div>
  );
}

function weekRangeLabel(startIso, endIso) {
  const s = new Date(startIso + "T12:00:00");
  const e = new Date(endIso + "T12:00:00");
  const sm = s.toLocaleString("en", { month: "short" });
  const em = e.toLocaleString("en", { month: "short" });
  return `${sm} ${s.getDate()} — ${sm === em ? "" : em + " "}${e.getDate()}`;
}

function computeTotals(days, entries) {
  const t = {
    walkDays: 0,
    walkKm: 0,
    squashDays: 0,
    tkdDays: 0,
    strengthDays: 0,
    proteinDays: 0,
    calories: 0,
    byDay: {},
  };
  const ACTS = ["walk", "squash", "taekwondo", "strength", "protein"];
  const byKey = {};
  for (const e of entries) byKey[`${e.date}|${e.activity}`] = e;

  for (const d of days) {
    let done = 0;
    let total = 0;
    for (const a of ACTS) {
      const e = byKey[`${d}|${a}`];
      total += 1;
      if (e?.done) {
        done += 1;
        if (a === "walk") {
          t.walkDays++;
          t.walkKm += Number(e.distanceKm) || 0;
        }
        if (a === "squash") t.squashDays++;
        if (a === "taekwondo") t.tkdDays++;
        if (a === "strength") t.strengthDays++;
        if (a === "protein") t.proteinDays++;
      }
      if (e?.caloriesBurned) t.calories += Number(e.caloriesBurned) || 0;
    }
    t.byDay[d] = total ? done / total : 0;
  }
  return t;
}
