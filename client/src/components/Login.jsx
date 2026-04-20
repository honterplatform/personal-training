import { useState } from "react";
import { api } from "../api.js";
import { LockIcon } from "./Icons.jsx";

const ACCENT = "#ff5a3c";

export default function Login({ onSuccess }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setErr(false);
    try {
      await api.login(pw);
      onSuccess();
    } catch {
      setErr(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <div
        style={{
          position: "absolute",
          top: -100,
          left: -100,
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${ACCENT}44 0%, transparent 60%)`,
        }}
      />
      <div
        style={{
          fontFamily: "var(--serif)",
          fontStyle: "italic",
          fontSize: 96,
          lineHeight: 0.9,
          letterSpacing: -3,
        }}
      >
        LOG
      </div>
      <div
        style={{
          fontSize: 12,
          color: "rgba(244,239,229,0.5)",
          marginTop: 10,
          fontFamily: "var(--mono)",
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        training daily
      </div>

      <form
        onSubmit={submit}
        style={{
          marginTop: 56,
          width: "100%",
          maxWidth: 300,
          animation: shake ? "shake 400ms" : "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(244,239,229,0.06)",
            border: `1px solid ${err ? ACCENT : "rgba(244,239,229,0.1)"}`,
            borderRadius: 16,
            padding: "14px 16px",
          }}
        >
          <LockIcon size={16} style={{ color: "rgba(244,239,229,0.5)" }} />
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="password"
            autoFocus
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#f4efe5",
              fontSize: 16,
              letterSpacing: 0.3,
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 12,
            width: "100%",
            padding: "14px",
            background: ACCENT,
            color: "#fff",
            borderRadius: 16,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: -0.1,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "…" : "enter"}
        </button>
      </form>
      <div
        style={{
          position: "absolute",
          bottom: 40,
          fontSize: 10,
          fontFamily: "var(--mono)",
          color: "rgba(244,239,229,0.3)",
          letterSpacing: 1.5,
        }}
      >
        one user · gated · bogotá
      </div>
    </div>
  );
}
