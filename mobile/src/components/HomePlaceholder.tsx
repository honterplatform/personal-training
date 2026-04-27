import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts } from "../lib/theme";
import { useStore } from "../lib/store";

export default function HomePlaceholder() {
  const { settings, weekEntries, selectedDate } = useStore();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.brand}>LOG</Text>
        <Text style={styles.tag}>auth round-trip working — UI coming next</Text>

        <View style={styles.card}>
          <Text style={styles.label}>settings</Text>
          <Text style={styles.line}>body weight: {fmt(settings.bodyWeightKg)} kg</Text>
          <Text style={styles.line}>protein goal: {fmt(settings.proteinGoalG)} g</Text>
          <Text style={styles.line}>sex: {settings.sex ?? "—"}</Text>
          <Text style={styles.line}>age: {settings.age ?? "—"}</Text>
          <Text style={styles.line}>fitness: {settings.fitnessLevel ?? "—"}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>this week</Text>
          <Text style={styles.line}>selected date: {selectedDate}</Text>
          <Text style={styles.line}>entries this week: {weekEntries.length}</Text>
          <Text style={styles.line}>
            done: {weekEntries.filter((e) => e.done).length}
          </Text>
          <Text style={styles.line}>
            kcal burned: {weekEntries.reduce((s, e) => s + (e.caloriesBurned ?? 0), 0)}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function fmt(n?: number | null) {
  if (n == null) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { padding: 20, paddingBottom: 60 },
  brand: {
    fontFamily: fonts.serif,
    fontSize: 48,
    color: colors.accent,
    lineHeight: 50,
  },
  tag: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.mutedInk,
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    gap: 6,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.mutedInk,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  line: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink },
});
