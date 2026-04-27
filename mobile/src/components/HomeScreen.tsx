import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../lib/store";
import { colors, fonts } from "../lib/theme";

export default function HomeScreen() {
  const { user, trackers, weekEntries, signOut } = useStore();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.brand}>LOG</Text>
        <Text style={styles.tag}>signed in — full UI coming next phase</Text>

        <View style={styles.card}>
          <Text style={styles.label}>account</Text>
          <Text style={styles.line}>{user?.email}</Text>
          {user?.displayName ? <Text style={styles.line}>{user.displayName}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>demographics</Text>
          <Text style={styles.line}>weight: {fmt(user?.demographics.weightKg)} kg</Text>
          <Text style={styles.line}>height: {fmt(user?.demographics.heightCm)} cm</Text>
          <Text style={styles.line}>sex: {user?.demographics.sex ?? "—"}</Text>
          <Text style={styles.line}>age: {user?.demographics.age ?? "—"}</Text>
          <Text style={styles.line}>fitness: {user?.demographics.fitnessLevel ?? "—"}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>this week</Text>
          <Text style={styles.line}>trackers: {trackers.length}</Text>
          <Text style={styles.line}>entries this week: {weekEntries.length}</Text>
          <Text style={styles.line}>
            kcal burned: {weekEntries.reduce((s, e) => s + (e.caloriesBurned ?? 0), 0)}
          </Text>
        </View>

        <Pressable onPress={signOut} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>log out</Text>
        </Pressable>
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
  brand: { fontFamily: fonts.serif, fontSize: 48, color: colors.accent, lineHeight: 50 },
  tag: {
    fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.2,
    color: colors.mutedInk, textTransform: "uppercase",
    marginTop: 8, marginBottom: 24,
  },
  card: {
    backgroundColor: colors.card, borderRadius: 22, padding: 18,
    marginBottom: 12, gap: 6,
  },
  label: {
    fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.2,
    color: colors.mutedInk, textTransform: "uppercase", marginBottom: 6,
  },
  line: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink },
  logoutBtn: {
    marginTop: 24, alignSelf: "center",
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 999, backgroundColor: colors.creamTint,
  },
  logoutText: {
    fontFamily: fonts.mono, fontSize: 11,
    color: colors.mutedInk, letterSpacing: 0.4,
  },
});
