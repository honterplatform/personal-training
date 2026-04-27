import { ActivityIndicator, View } from "react-native";
import { useStore } from "../src/lib/store";
import { colors } from "../src/lib/theme";
import LoginScreen from "../src/components/LoginScreen";
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
  if (authState === "unauthed") return <LoginScreen />;
  return <HomeScreen />;
}
