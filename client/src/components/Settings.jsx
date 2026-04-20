import { useState } from "react";
import { api } from "../api.js";
import { XIcon } from "./Icons.jsx";

export default function Settings({ settings, onClose, onSaved }) {
  const [bw, setBw] = useState(settings?.bodyWeightKg ?? 75);
  const [pg, setPg] = useState(settings?.proteinGoalG ?? 150);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const next = await api.saveSettings({
        bodyWeightKg: Number(bw) || 0,
        proteinGoalG: Number(pg) || 0,
      });
      onSaved(next);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        background: "rgba(23,20,15,0.5)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#f4efe5",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: "20px 22px 34px",
          animation: "slideUp 260ms cubic-bezier(.2,.7,.3,1)",
        }}
      >
        <div
          style={{
            width: 40,
            height: 4,
            background: "rgba(26,23,22,0.15)",
            borderRadius: 2,
            margin: "0 auto 16px",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 32, lineHeight: 1, letterSpacing: -0.5 }}>
            Settings
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#ebe5d6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <XIcon size={16} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="body weight" unit="kg" value={bw} onChange={setBw} />
          <Field label="daily protein goal" unit="g" value={pg} onChange={setPg} />
        </div>

        <button
          onClick={save}
          disabled={saving}
          style={{
            width: "100%",
            marginTop: 22,
            padding: "15px",
            background: "#17140f",
            color: "#f4efe5",
            borderRadius: 16,
            fontSize: 14,
            fontWeight: 600,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "saving…" : "save"}
        </button>

        <div
          style={{
            marginTop: 18,
            paddingTop: 16,
            borderTop: "1px solid rgba(26,23,22,0.08)",
            fontSize: 10,
            fontFamily: "var(--mono)",
            color: "rgba(26,23,22,0.4)",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>v1.0</span>
          <span>america/bogotá</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, unit, value, onChange }) {
  return (
    <label>
      <div
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
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          background: "#fff",
          borderRadius: 14,
          padding: "14px 16px",
          border: "1px solid rgba(26,23,22,0.06)",
        }}
      >
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 26,
            fontWeight: 600,
            color: "#1a1716",
            letterSpacing: -0.5,
            fontFamily: "var(--serif)",
            fontStyle: "italic",
            minWidth: 0,
            width: "100%",
          }}
        />
        <span style={{ fontSize: 13, color: "rgba(26,23,22,0.5)", fontFamily: "var(--mono)" }}>{unit}</span>
      </div>
    </label>
  );
}
