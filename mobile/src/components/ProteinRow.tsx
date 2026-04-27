import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../lib/theme";
import { CheckIcon, ChevDown, ProteinIcon } from "./Icons";
import type { Entry } from "../lib/api";

export default function ProteinRow({
  entry,
  goal,
  open,
  onToggleOpen,
  onToggleDone,
}: {
  entry?: Entry;
  goal: number;
  open: boolean;
  onToggleOpen: () => void;
  onToggleDone: () => void;
}) {
  const done = !!entry?.done;
  const g = entry?.proteinG ?? 0;

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onToggleOpen}
        style={({ pressed }) => [styles.head, pressed && { opacity: 0.85 }]}
      >
        <Pressable
          hitSlop={10}
          onPress={(e) => { e.stopPropagation(); onToggleDone(); }}
          style={[styles.check, done && styles.checkDone]}
        >
          {done && <CheckIcon size={15} color="#fff" strokeWidth={2.5} />}
        </Pressable>
        <View style={[styles.iconTile, done && { backgroundColor: "rgba(255,90,60,0.08)" }]}>
          <ProteinIcon size={20} color={done ? colors.accent : colors.ink} strokeWidth={1.8} />
        </View>
        <View style={styles.center}>
          <Text style={[styles.name, done && styles.nameDone]}>Protein</Text>
          <Text style={styles.subtitle}>{g} / {goal}g</Text>
        </View>
        <View style={[styles.chev, open && { transform: [{ rotate: "180deg" }] }]}>
          <ChevDown size={18} color="rgba(26,23,22,0.4)" strokeWidth={2} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(26,23,22,0.07)",
    marginBottom: 10,
    overflow: "hidden",
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: "rgba(26,23,22,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, minWidth: 0 },
  name: {
    fontFamily: fonts.sansSemibold,
    fontSize: 16,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  nameDone: {
    color: "rgba(26,23,22,0.55)",
    textDecorationLine: "line-through",
    textDecorationColor: colors.accent,
  },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: 12.5,
    color: colors.mutedInk,
    marginTop: 2,
  },
  chev: { marginLeft: 4 },
});
