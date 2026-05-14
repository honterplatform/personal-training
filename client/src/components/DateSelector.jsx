import { todayISO } from "../lib/dates.js";

export default function DateSelector({ value, onChange, dayKcal }) {
  const today = todayISO();
  const d = new Date(value + "T12:00:00");
  const weekday = d.toLocaleString("en", { weekday: "long", timeZone: "America/Bogota" });
  const dayNum = d.getDate();
  const month = d.toLocaleString("en", { month: "long", timeZone: "America/Bogota" }).toLowerCase();
  const year = d.getFullYear();
  const isToday = value === today;

  return (
    <div className="date-selector">
      <div className="date-row">
        <label className="date-trigger">
          <span className="date-weekday">{weekday}</span>
          <input
            type="date"
            value={value}
            max={today}
            onChange={(e) => e.target.value && onChange(e.target.value)}
            className="date-native"
          />
        </label>
        <span className="date-iso">
          {String(dayNum).padStart(2, "0")} {month} {year}
        </span>
        {!isToday && (
          <button onClick={() => onChange(today)} className="date-today">
            → today
          </button>
        )}
      </div>
      {dayKcal > 0 ? (
        <div className="date-kcal">{dayKcal.toLocaleString()} kcal burned today</div>
      ) : null}
    </div>
  );
}
