import { StyleSheet, Text, View } from "react-native";
import { STRENGTH_ROUTINE } from "../lib/strengthRoutine";
import { colors, fonts } from "../lib/theme";

export default function StrengthReference() {
  return (
    <View>
      <View style={styles.header}>
        <View style={styles.rule} />
        <Text style={styles.title}>reference routine · 8 moves</Text>
        <View style={styles.rule} />
      </View>
      <View style={{ gap: 8 }}>
        {STRENGTH_ROUTINE.map((ex, i) => (
          <View key={ex.name} style={styles.card}>
            <Text style={styles.num}>{String(i + 1).padStart(2, "0")}</Text>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.titleRow}>
                <Text style={styles.name}>{ex.name}</Text>
                <Text style={styles.focus}> · {ex.focus}</Text>
              </View>
              <Text style={styles.meta}>
                {ex.sets} · rest {ex.rest}
              </Text>
              <Text style={styles.reps}>{ex.reps}</Text>
              {ex.cue && ex.cue !== "—" ? (
                <Text style={styles.cue}>“{ex.cue}”</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  rule: { flex: 1, height: 1, backgroundColor: "rgba(26,23,22,0.1)" },
  title: {
    fontFamily: fonts.mono,
    fontSize: 10.5,
    letterSpacing: 0.5,
    color: colors.mutedInk,
    textTransform: "uppercase",
  },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.cream,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(26,23,22,0.04)",
  },
  num: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.accent,
    width: 28,
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  titleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline" },
  name: {
    fontFamily: fonts.sansSemibold,
    fontSize: 14.5,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  focus: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: "rgba(26,23,22,0.45)",
    textTransform: "lowercase",
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: "rgba(26,23,22,0.6)",
    marginTop: 3,
  },
  reps: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: "rgba(26,23,22,0.7)",
    marginTop: 5,
    lineHeight: 18,
  },
  cue: {
    fontFamily: fonts.serif,
    fontSize: 13,
    color: colors.accent,
    marginTop: 5,
  },
});
