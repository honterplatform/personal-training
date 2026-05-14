import { useState } from "react";
import { useStore } from "../lib/store.jsx";
import DemographicsStep from "./onboarding/DemographicsStep.jsx";
import TrackersStep from "./onboarding/TrackersStep.jsx";

export default function OnboardingScreen() {
  const { user, updateProfile, createTracker } = useStore();
  const [step, setStep] = useState("demographics");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function submitDemographics(demographics) {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ demographics });
      setStep("trackers");
    } catch (e) {
      setError(e?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function finishOnboarding(trackers) {
    setSaving(true);
    setError(null);
    try {
      for (const t of trackers) {
        await createTracker(t);
      }
      await updateProfile({ onboardedAt: true });
    } catch (e) {
      setError(e?.message || "Could not finish onboarding");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="onboarding-shell">
      <div className="onboarding-inner">
        <div className="onboarding-progress">
          <div className={`progress-dot ${step === "demographics" ? "active" : "done"}`} />
          <div className={`progress-dot ${step === "trackers" ? "active" : ""}`} />
        </div>

        {step === "demographics" ? (
          <DemographicsStep
            initial={user?.demographics}
            displayName={user?.displayName}
            saving={saving}
            error={error}
            onSubmit={submitDemographics}
          />
        ) : (
          <TrackersStep
            saving={saving}
            error={error}
            onBack={() => setStep("demographics")}
            onSubmit={finishOnboarding}
          />
        )}
      </div>
    </div>
  );
}
