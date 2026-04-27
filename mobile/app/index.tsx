import { ActivityIndicator, View } from "react-native";
import { useStore } from "../src/lib/store";
import { colors } from "../src/lib/theme";
import SignedOutScreen from "../src/components/SignedOutScreen";
import OnboardingScreen from "../src/components/OnboardingScreen";
import HomeScreen from "../src/components/HomeScreen";

export default function Index() {
  const { state } = useStore();

  if (state === "loading") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (state === "signedOut") return <SignedOutScreen />;
  if (state === "needsOnboarding") return <OnboardingScreen />;
  return <HomeScreen />;
}
