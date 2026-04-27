import { ActivityIndicator, View } from "react-native";
import { useStore } from "../src/lib/store";
import { colors } from "../src/lib/theme";
import SignedOutScreen from "../src/components/SignedOutScreen";
import OnboardingScreen from "../src/components/OnboardingScreen";
import HomeScreen from "../src/components/HomeScreen";

export default function Index() {
  const { authState } = useStore();

  if (authState === "loading") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (authState === "signedOut") return <SignedOutScreen />;
  if (authState === "needsOnboarding") return <OnboardingScreen />;
  return <HomeScreen />;
}
