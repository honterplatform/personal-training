import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts } from "../lib/theme";

// Stub for the onboarding flow — real demographics + tracker picker
// land in the next phase.
export default function OnboardingScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.brand}>welcome to LOG</Text>
        <Text style={styles.body}>
          Onboarding coming next: demographics, then your trackers.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  brand: { fontFamily: fonts.serif, fontSize: 40, color: colors.ink, lineHeight: 42 },
  body: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.mutedInk,
    textAlign: "center",
    lineHeight: 20,
  },
});
