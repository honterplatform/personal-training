import { useEffect, useState } from "react";
import { ProteinIcon, CheckIcon, ChevDown, NoteIcon } from "./Icons.jsx";

const ACCENT = "#ff5a3c";

export default function ProteinRow({ entry, goal, open, onToggleOpen, onSave, onDelete }) {
  const done = !!entry?.done;
  const g = entry?.proteinG || 0;
  const subtitle = `${g} / ${goal}g`;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid rgba(26,23,22,0.07)",
        borderRadius: 22,
        marginBottom: 10,
        overflow: "hidden",
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
            onSave({ done: !done, proteinG: entry?.proteinG ?? null, notes: entry?.notes ?? "" });
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
          <ProteinIcon size={20} stroke={1.8} />
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
            Protein
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: "rgba(26,23,22,0.5)",
              marginTop: 2,
              fontFamily: "var(--mono)",
              letterSpacing: 0.1,
            }}
          >
            {subtitle}
          </div>
        </div>
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
          <Body entry={entry} goal={goal} onSave={onSave} onDelete={onDelete} />
        </div>
      )}
    </div>
  );
}

function Body({ entry, goal, onSave, onDelete }) {
  const [proteinG, setG] = useState(entry?.proteinG ?? "");
  const [notes, setNotes] = useState(entry?.notes ?? "");

  useEffect(() => {
    setG(entry?.proteinG ?? "");
    setNotes(entry?.notes ?? "");
  }, [entry?._id, entry?.updatedAt]);

  const commit = (patch = {}) => {
    const g = patch.proteinG ?? (proteinG === "" ? null : Number(proteinG));
    const autoDone = g != null && goal > 0 && g >= goal;
    onSave({
      done: patch.done ?? (autoDone || !!entry?.done),
      proteinG: g,
      notes: patch.notes ?? notes,
    });
  };

  const g = Number(proteinG) || 0;
  const pct = Math.min(1, g / goal);

  const addQuick = (inc) => {
    const next = g + inc;
    setG(String(next));
    commit({ proteinG: next });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 14 }}>
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
          <span>intake</span>
          <span style={{ color: g >= goal ? ACCENT : "rgba(26,23,22,0.4)", fontWeight: 600 }}>
            {g}/{goal}g
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            background: "#f4efe5",
            borderRadius: 12,
            padding: "14px 16px",
            border: "1px solid rgba(26,23,22,0.05)",
          }}
        >
          <input
            type="number"
            value={proteinG}
            placeholder="0"
            onChange={(e) => setG(e.target.value)}
            onBlur={() => commit()}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 32,
              fontWeight: 600,
              color: "#1a1716",
              letterSpacing: -0.8,
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              minWidth: 0,
              width: "100%",
            }}
          />
          <span style={{ fontSize: 14, color: "rgba(26,23,22,0.5)", fontFamily: "var(--mono)" }}>grams</span>
        </div>
        <div style={{ marginTop: 10, height: 6, background: "#f4efe5", borderRadius: 4, overflow: "hidden" }}>
          <div
            style={{
              width: `${pct * 100}%`,
              height: "100%",
              background: g >= goal ? ACCENT : "#1a1716",
              transition: "width 300ms",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, gap: 6 }}>
          {[25, 50, 100, 150].map((inc) => (
            <button
              key={inc}
              onClick={() => addQuick(inc)}
              style={{
                flex: 1,
                padding: "8px 0",
                fontSize: 12,
                fontWeight: 600,
                background: "#f4efe5",
                borderRadius: 10,
                color: "rgba(26,23,22,0.7)",
                fontFamily: "var(--mono)",
                border: "1px solid rgba(26,23,22,0.04)",
              }}
            >
              +{inc}
            </button>
          ))}
        </div>
      </div>
      <NotesField value={notes} onChange={setNotes} onCommit={() => commit()} />
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
