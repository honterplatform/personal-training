import { useEffect, useState } from "react";
import StrengthReference from "./StrengthReference.jsx";
import {
  WalkIcon,
  SquashIcon,
  TkdIcon,
  StrengthIcon,
  CheckIcon,
  ChevDown,
  FlameIcon,
  NoteIcon,
} from "./Icons.jsx";

const ACCENT = "#ff5a3c";

const META = {
  walk: { name: "Walk", target: "≥6 km", Icon: WalkIcon },
  squash: { name: "Squash", target: "60 min", Icon: SquashIcon },
  taekwondo: { name: "Taekwondo", target: "60 min", Icon: TkdIcon },
  strength: { name: "Strength", target: "8 moves", Icon: StrengthIcon },
};

export default function ActivityRow({ activity, entry, open, onToggleOpen, onSave, onDelete }) {
  const meta = META[activity];
  const done = !!entry?.done;
  const needsDuration = done && !entry?.durationMin;
  const subtitle = needsDuration
    ? "add duration for kcal estimate"
    : describe(activity, entry) || meta.target;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid rgba(26,23,22,0.07)",
        borderRadius: 22,
        marginBottom: 10,
        overflow: "hidden",
        transition: "background 200ms",
      }}
    >
      <button
        onClick={onToggleOpen}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 18px",
          textAlign: "left",
        }}
      >
        <span
          onClick={(e) => {
            e.stopPropagation();
            const next = !done;
            onSave({ done: next });
            if (next && !entry?.durationMin && !open) onToggleOpen();
          }}
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: done ? "none" : "1.5px solid rgba(26,23,22,0.25)",
            background: done ? ACCENT : "transparent",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 160ms",
          }}
        >
          {done && <CheckIcon size={15} stroke={2.5} />}
        </span>
        <span
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: done ? `${ACCENT}14` : "#f4efe5",
            color: done ? ACCENT : "#1a1716",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <meta.Icon size={20} stroke={1.8} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: -0.2,
              textDecoration: done ? "line-through" : "none",
              textDecorationColor: ACCENT,
              textDecorationThickness: "1.5px",
              color: done ? "rgba(26,23,22,0.55)" : "#1a1716",
            }}
          >
            {meta.name}
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: "rgba(26,23,22,0.5)",
              marginTop: 2,
              fontFamily: "var(--mono)",
              letterSpacing: 0.1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {subtitle}
          </div>
        </div>
        {entry?.caloriesBurned > 0 && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              color: ACCENT,
              fontFamily: "var(--mono)",
              padding: "4px 8px",
              borderRadius: 999,
              background: `${ACCENT}14`,
            }}
          >
            <FlameIcon size={11} stroke={2} />
            {entry.caloriesBurned}
          </span>
        )}
        <ChevDown
          size={18}
          stroke={2}
          style={{
            color: "rgba(26,23,22,0.4)",
            transform: `rotate(${open ? 180 : 0}deg)`,
            transition: "transform 200ms",
          }}
        />
      </button>

      {open && (
        <div style={{ padding: "4px 18px 18px", borderTop: "1px solid rgba(26,23,22,0.06)" }}>
          <Body activity={activity} entry={entry} onSave={onSave} onDelete={onDelete} />
        </div>
      )}
    </div>
  );
}

function describe(id, entry) {
  if (!entry) return null;
  if (id === "walk" && entry.distanceKm) return `${entry.distanceKm} km · ${entry.durationMin || "?"} min`;
  if ((id === "squash" || id === "taekwondo" || id === "strength") && entry.durationMin) {
    return `${entry.durationMin} min${entry.rpe ? ` · rpe ${entry.rpe}` : ""}`;
  }
  return null;
}

function Body({ activity, entry, onSave, onDelete }) {
  const [distanceKm, setDistance] = useState(entry?.distanceKm ?? "");
  const [durationMin, setDuration] = useState(entry?.durationMin ?? "");
  const [rpe, setRpe] = useState(entry?.rpe ?? null);
  const [notes, setNotes] = useState(entry?.notes ?? "");

  useEffect(() => {
    setDistance(entry?.distanceKm ?? "");
    setDuration(entry?.durationMin ?? "");
    setRpe(entry?.rpe ?? null);
    setNotes(entry?.notes ?? "");
  }, [entry?._id, entry?.updatedAt]);

  const commit = (patch = {}) => {
    onSave({
      done: !!entry?.done,
      distanceKm: patch.distanceKm ?? (distanceKm === "" ? null : Number(distanceKm)),
      durationMin: patch.durationMin ?? (durationMin === "" ? null : Number(durationMin)),
      rpe: patch.rpe ?? rpe,
      notes: patch.notes ?? notes,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 14 }}>
      <div className="fields-row">
        {activity === "walk" && (
          <NumField
            label="distance"
            unit="km"
            value={distanceKm}
            onChange={setDistance}
            onCommit={() => commit()}
            placeholder="6.0"
          />
        )}
        <NumField
          label="duration"
          unit="min"
          value={durationMin}
          onChange={setDuration}
          onCommit={() => commit()}
          placeholder={activity === "walk" ? "60" : activity === "strength" ? "60" : "45"}
        />
      </div>
      <RPERow
        value={rpe}
        onChange={(v) => {
          setRpe(v);
          commit({ rpe: v });
        }}
      />
      <NotesField
        value={notes}
        onChange={setNotes}
        onCommit={() => commit()}
      />
      {activity === "strength" && <StrengthReference />}
      {entry?._id && (
        <button
          onClick={onDelete}
          style={{
            alignSelf: "flex-start",
            fontSize: 11,
            color: "rgba(26,23,22,0.45)",
            fontFamily: "var(--mono)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          clear entry
        </button>
      )}
    </div>
  );
}

function NumField({ label, unit, value, onChange, onCommit, placeholder }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
      <span
        style={{
          fontSize: 10.5,
          color: "rgba(26,23,22,0.5)",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          fontFamily: "var(--mono)",
          marginBottom: 6,
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          background: "#f4efe5",
          borderRadius: 12,
          padding: "10px 12px",
          border: "1px solid rgba(26,23,22,0.05)",
        }}
      >
        <input
          type="number"
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onCommit}
          style={{
            flex: 1,
            minWidth: 0,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 20,
            fontWeight: 600,
            color: "#1a1716",
            letterSpacing: -0.3,
            fontFamily: "var(--serif)",
            fontStyle: "italic",
          }}
        />
        {unit && (
          <span style={{ fontSize: 12, color: "rgba(26,23,22,0.45)", fontFamily: "var(--mono)" }}>{unit}</span>
        )}
      </div>
    </label>
  );
}

function RPERow({ value, onChange }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10.5,
          color: "rgba(26,23,22,0.5)",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          fontFamily: "var(--mono)",
          marginBottom: 8,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>RPE</span>
        <span style={{ color: value ? ACCENT : "rgba(26,23,22,0.35)", fontWeight: 600 }}>
          {value ? value + "/10" : "tap to rate"}
        </span>
      </div>
      <div className="rpe-grid">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const active = value >= n;
          return (
            <button
              key={n}
              className="rpe-btn"
              onClick={() => onChange(value === n ? null : n)}
              style={{
                background: active ? ACCENT : "#f4efe5",
                color: active ? "#fff" : "rgba(26,23,22,0.55)",
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NotesField({ value, onChange, onCommit }) {
  const [open, setOpen] = useState(!!value);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          color: "rgba(26,23,22,0.5)",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          fontFamily: "var(--mono)",
        }}
      >
        <NoteIcon size={12} stroke={2} />
        {open ? "notes" : value ? "notes" : "+ notes"}
      </button>
      {open && (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onCommit}
          placeholder="how did it feel?"
          rows={2}
          style={{
            marginTop: 8,
            width: "100%",
            padding: "10px 12px",
            background: "#f4efe5",
            border: "1px solid rgba(26,23,22,0.05)",
            borderRadius: 12,
            resize: "none",
            outline: "none",
            fontSize: 16,
            color: "#1a1716",
            fontFamily: "var(--sans)",
            lineHeight: 1.4,
          }}
        />
      )}
    </div>
  );
}
