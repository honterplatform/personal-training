import { STRENGTH_ROUTINE } from "../lib/strengthRoutine.js";

const ACCENT = "#ff5a3c";

export default function StrengthReference() {
  return (
    <div>
      <div
        style={{
          fontSize: 10.5,
          color: "rgba(26,23,22,0.5)",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          fontFamily: "var(--mono)",
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ flex: 1, height: 1, background: "rgba(26,23,22,0.1)" }} />
        <span>reference routine · 8 moves</span>
        <span style={{ flex: 1, height: 1, background: "rgba(26,23,22,0.1)" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {STRENGTH_ROUTINE.map((ex, i) => (
          <div
            key={ex.name}
            style={{
              background: "#f4efe5",
              borderRadius: 14,
              padding: "12px 14px",
              border: "1px solid rgba(26,23,22,0.04)",
              display: "flex",
              gap: 12,
            }}
          >
            <div
              style={{
                fontFamily: "var(--serif)",
                fontStyle: "italic",
                fontSize: 24,
                lineHeight: 1,
                color: ACCENT,
                width: 28,
                flexShrink: 0,
                letterSpacing: -0.5,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: -0.2 }}>{ex.name}</span>
                <span
                  style={{
                    fontSize: 10,
                    color: "rgba(26,23,22,0.45)",
                    fontFamily: "var(--mono)",
                    textTransform: "lowercase",
                  }}
                >
                  · {ex.focus}
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(26,23,22,0.6)",
                  marginTop: 3,
                  fontFamily: "var(--mono)",
                }}
              >
                {ex.sets} · rest {ex.rest}
              </div>
              <div style={{ fontSize: 12.5, color: "rgba(26,23,22,0.7)", marginTop: 5, lineHeight: 1.45 }}>
                {ex.reps}
              </div>
              {ex.cue && ex.cue !== "—" && (
                <div
                  style={{
                    fontSize: 12,
                    color: ACCENT,
                    marginTop: 5,
                    fontFamily: "var(--serif)",
                    fontStyle: "italic",
                  }}
                >
                  “{ex.cue}”
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
