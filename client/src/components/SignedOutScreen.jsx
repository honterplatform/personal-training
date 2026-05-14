import { useState } from "react";
import { useStore } from "../lib/store.jsx";

export default function SignedOutScreen() {
  const { signup, login } = useStore();
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (loading || !email.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      if (mode === "signup") {
        await signup(email.trim(), password, displayName.trim() || undefined);
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="signed-out-shell">
      <div className="splash-glow" />
      <div className="splash-center">
        <div className="brand-mark">LOG</div>
        <div className="brand-tag">training daily</div>

        <form className="auth-form" onSubmit={submit}>
          <div className="toggle">
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); }}
              className={`toggle-tab ${mode === "signup" ? "active" : ""}`}
            >
              sign up
            </button>
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); }}
              className={`toggle-tab ${mode === "login" ? "active" : ""}`}
            >
              log in
            </button>
          </div>

          {mode === "signup" && (
            <input
              type="text"
              placeholder="display name (optional)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="auth-input"
              autoComplete="name"
            />
          )}
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            className="auth-input"
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="auth-input"
          />

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading || !email.trim() || !password}
          >
            {loading ? "…" : mode === "signup" ? "create account" : "enter"}
          </button>

          <div className="auth-back">
            {mode === "signup"
              ? "min 8 characters · no email verification needed"
              : "welcome back"}
          </div>
        </form>
      </div>
      <div className="splash-footer">free · one log per athlete</div>
    </div>
  );
}
