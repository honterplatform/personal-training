import { useState } from "react";
import { api } from "../api.js";
import { XIcon } from "./Icons.jsx";

const ACCENT = "#ff5a3c";

export default function Settings({ settings, onClose, onSaved }) {
  const [bw, setBw] = useState(settings?.bodyWeightKg ?? 75);
  const [pg, setPg] = useState(settings?.proteinGoalG ?? 150);
  const [sex, setSex] = useState(settings?.sex ?? "");
  const [age, setAge] = useState(settings?.age ?? "");
  const [fitness, setFitness] = useState(settings?.fitnessLevel ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const next = await api.saveSettings({
        bodyWeightKg: Number(bw) || 0,
        proteinGoalG: Number(pg) || 0,
        sex: sex || null,
        age: age === "" ? null : Number(age),
        fitnessLevel: fitness || null,
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
          maxHeight: "92vh",
          overflowY: "auto",
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
          <NumInput label="body weight" unit="kg" value={bw} onChange={setBw} />
          <NumInput label="daily protein goal" unit="g" value={pg} onChange={setPg} />
          <NumInput label="age" unit="yrs" value={age} onChange={setAge} placeholder="e.g. 32" />

          <Pills
            label="sex"
            value={sex}
            onChange={setSex}
            options={[
              { id: "male", label: "male" },
              { id: "female", label: "female" },
              { id: "other", label: "other" },
            ]}
          />
          <Pills
            label="fitness level"
            hint="used to refine calorie estimates"
            value={fitness}
            onChange={setFitness}
            options={[
              { id: "beginner", label: "beginner" },
              { id: "intermediate", label: "intermediate" },
              { id: "advanced", label: "advanced" },
            ]}
          />
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

function NumInput({ label, unit, value, onChange, placeholder }) {
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
          placeholder={placeholder}
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
        {unit && <span style={{ fontSize: 13, color: "rgba(26,23,22,0.5)", fontFamily: "var(--mono)" }}>{unit}</span>}
      </div>
    </label>
  );
}

function Pills({ label, hint, value, onChange, options }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10.5,
          color: "rgba(26,23,22,0.5)",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          fontFamily: "var(--mono)",
          marginBottom: hint ? 2 : 6,
        }}
      >
        {label}
      </div>
      {hint && (
        <div
          style={{
            fontSize: 11,
            color: "rgba(26,23,22,0.45)",
            marginBottom: 6,
            lineHeight: 1.3,
          }}
        >
          {hint}
        </div>
      )}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(active ? "" : opt.id)}
              style={{
                flex: "1 1 90px",
                minWidth: 0,
                padding: "10px 12px",
                borderRadius: 12,
                background: active ? ACCENT : "#fff",
                color: active ? "#fff" : "rgba(26,23,22,0.7)",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: -0.1,
                border: active ? "1px solid transparent" : "1px solid rgba(26,23,22,0.06)",
                transition: "all 120ms",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
