import { useState } from "react";
import { useSignIn, useSignUp } from "@clerk/clerk-react";

export default function SignedOutScreen() {
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();
  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();

  const [mode, setMode] = useState("signup");
  const [step, setStep] = useState("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function reset(next) {
    setMode(next);
    setStep("credentials");
    setError(null);
    setCode("");
  }

  async function startSignUp() {
    if (!signUpLoaded || !email.trim() || !password) return;
    setLoading(true); setError(null);
    try {
      await signUp.create({ emailAddress: email.trim(), password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (e) { setError(extractClerkError(e)); }
    finally { setLoading(false); }
  }

  async function completeSignUp() {
    if (!signUpLoaded || !code.trim()) return;
    setLoading(true); setError(null);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (result.status === "complete") {
        await setSignUpActive({ session: result.createdSessionId });
      } else {
        setError("Verification failed. Try again.");
      }
    } catch (e) { setError(extractClerkError(e)); }
    finally { setLoading(false); }
  }

  async function logIn() {
    if (!signInLoaded || !email.trim() || !password) return;
    setLoading(true); setError(null);
    try {
      const result = await signIn.create({ identifier: email.trim(), password });
      if (result.status === "complete") {
        await setSignInActive({ session: result.createdSessionId });
      } else {
        setError("Sign in incomplete.");
      }
    } catch (e) { setError(extractClerkError(e)); }
    finally { setLoading(false); }
  }

  return (
    <div className="signed-out-shell">
      <div className="splash-glow" />
      <div className="splash-center">
        <div className="brand-mark">LOG</div>
        <div className="brand-tag">training daily</div>

        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (step === "verify") completeSignUp();
            else if (mode === "signup") startSignUp();
            else logIn();
          }}
        >
          {step === "credentials" ? (
            <>
              <div className="toggle">
                <button
                  type="button"
                  onClick={() => reset("signup")}
                  className={`toggle-tab ${mode === "signup" ? "active" : ""}`}
                >
                  sign up
                </button>
                <button
                  type="button"
                  onClick={() => reset("login")}
                  className={`toggle-tab ${mode === "login" ? "active" : ""}`}
                >
                  log in
                </button>
              </div>

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
            </>
          ) : (
            <>
              <div className="verify-title">check your email</div>
              <div className="verify-body">
                We sent a 6-digit code to {email}. Enter it below to finish signing up.
              </div>
              <input
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="auth-input"
              />
              {error && <div className="auth-error">{error}</div>}
              <button
                type="submit"
                className="auth-submit"
                disabled={loading || code.trim().length < 6}
              >
                {loading ? "…" : "verify"}
              </button>
              <button
                type="button"
                onClick={() => reset(mode)}
                className="auth-back"
              >
                ← change email
              </button>
            </>
          )}
        </form>
      </div>
      <div className="splash-footer">free · secured by clerk</div>
    </div>
  );
}

function extractClerkError(e) {
  return (
    e?.errors?.[0]?.longMessage ||
    e?.errors?.[0]?.message ||
    e?.message ||
    "Something went wrong"
  );
}
