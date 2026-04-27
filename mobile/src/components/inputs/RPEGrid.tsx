import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../../lib/theme";

export default function RPEGrid({
  value,
  onChange,
}: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
}) {
  return (
    <View>
      <View style={styles.headRow}>
        <Text style={styles.label}>RPE</Text>
        <Text style={[styles.right, { color: value ? colors.accent : "rgba(26,23,22,0.35)" }]}>
          {value ? `${value}/10` : "tap to rate"}
        </Text>
      </View>
      <Text style={styles.gloss}>
        Rate of perceived exertion — how hard it felt. 1 = barely moving, 5 = conversational, 7 = breathing hard, 10 = all-out.
      </Text>
      <View style={styles.grid}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const active = (value ?? 0) >= n;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(value === n ? null : n)}
              style={[styles.cell, active ? styles.cellActive : styles.cellIdle]}
            >
              <Text style={[styles.cellText, active && { color: "#fff" }]}>{n}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 4,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10.5,
    letterSpacing: 0.5,
    color: colors.mutedInk,
    textTransform: "uppercase",
  },
  right: { fontFamily: fonts.monoMedium, fontSize: 11 },
  gloss: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: "rgba(26,23,22,0.45)",
    lineHeight: 15,
    marginBottom: 8,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  cell: {
    width: "18.4%",
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(26,23,22,0.04)",
  },
  cellIdle: { backgroundColor: colors.cream },
  cellActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  cellText: {
    fontFamily: fonts.sansSemibold,
    fontSize: 13,
    color: "rgba(26,23,22,0.55)",
  },
});
