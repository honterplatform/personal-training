import { todayISO } from "../lib/dates.js";

export default function DatePicker({ value, onChange }) {
  const today = todayISO();
  const d = new Date(value + "T12:00:00");
  const weekday = d.toLocaleString("en", { weekday: "long", timeZone: "America/Bogota" });
  const dayNum = d.getDate();
  const month = d.toLocaleString("en", { month: "long", timeZone: "America/Bogota" });
  const year = d.getFullYear();
  const isToday = value === today;

  return (
    <div style={{ padding: "4px 0 14px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <div
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "baseline",
            fontFamily: "var(--serif)",
            fontStyle: "italic",
            fontSize: 38,
            lineHeight: 1,
            letterSpacing: -1,
            color: "#1a1716",
            cursor: "pointer",
          }}
        >
          {weekday}
          <input
            type="date"
            value={value}
            max={today}
            onChange={(e) => e.target.value && onChange(e.target.value)}
            className="date-native"
          />
        </div>
        <div
          style={{
            fontSize: 13,
            color: "rgba(26,23,22,0.5)",
            fontFamily: "var(--mono)",
            letterSpacing: 0.2,
          }}
        >
          {String(dayNum).padStart(2, "0")} {month.toLowerCase()} {year}
        </div>
        {!isToday && (
          <button
            onClick={() => onChange(today)}
            style={{
              marginLeft: "auto",
              fontSize: 11,
              padding: "5px 10px",
              borderRadius: 999,
              background: "#ebe5d6",
              color: "rgba(26,23,22,0.7)",
              fontFamily: "var(--mono)",
              letterSpacing: 0.4,
            }}
          >
            → today
          </button>
        )}
      </div>
    </div>
  );
}
