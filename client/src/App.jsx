import { useStore } from "./lib/store.jsx";
import SignedOutScreen from "./components/SignedOutScreen.jsx";
import OnboardingScreen from "./components/OnboardingScreen.jsx";
import HomeScreen from "./components/HomeScreen.jsx";

export default function App() {
  const { state } = useStore();

  if (state === "loading") {
    return <div className="boot-screen"><div className="boot-spinner" /></div>;
  }
  if (state === "signedOut") return <SignedOutScreen />;
  if (state === "needsOnboarding") return <OnboardingScreen />;
  return <HomeScreen />;
}
