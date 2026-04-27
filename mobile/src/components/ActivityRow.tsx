import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../lib/theme";
import { CheckIcon, ChevDown, FlameIcon, StrengthIcon, SquashIcon, TkdIcon, WalkIcon } from "./Icons";
import type { Entry } from "../lib/api";

const META: Record<
  Exclude<Entry["activity"], "protein">,
  { name: string; target: string; Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }> }
> = {
  walk:      { name: "Walk",      target: "≥6 km",  Icon: WalkIcon },
  squash:    { name: "Squash",    target: "60 min", Icon: SquashIcon },
  taekwondo: { name: "Taekwondo", target: "60 min", Icon: TkdIcon },
  strength:  { name: "Strength",  target: "8 moves", Icon: StrengthIcon },
};

export default function ActivityRow({
  activity,
  entry,
  open,
  onToggleOpen,
  onToggleDone,
}: {
  activity: Exclude<Entry["activity"], "protein">;
  entry?: Entry;
  open: boolean;
  onToggleOpen: () => void;
  onToggleDone: () => void;
}) {
  const meta = META[activity];
  const done = !!entry?.done;
  const needsDuration = done && !entry?.durationMin;
  const subtitle = needsDuration
    ? "add duration for kcal estimate"
    : describe(activity, entry) || meta.target;
  const Icon = meta.Icon;

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
          <Icon size={20} color={done ? colors.accent : colors.ink} strokeWidth={1.8} />
        </View>
        <View style={styles.center}>
          <Text style={[styles.name, done && styles.nameDone]}>{meta.name}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        </View>
        {entry?.caloriesBurned ? (
          <View style={styles.kcal}>
            <FlameIcon size={11} color={colors.accent} strokeWidth={2} />
            <Text style={styles.kcalText}>{entry.caloriesBurned}</Text>
          </View>
        ) : null}
        <View style={[styles.chev, open && { transform: [{ rotate: "180deg" }] }]}>
          <ChevDown size={18} color="rgba(26,23,22,0.4)" strokeWidth={2} />
        </View>
      </Pressable>
    </View>
  );
}

function describe(id: Entry["activity"], entry?: Entry): string | null {
  if (!entry) return null;
  if (id === "walk" && entry.distanceKm) {
    return `${entry.distanceKm} km · ${entry.durationMin ?? "?"} min`;
  }
  if ((id === "squash" || id === "taekwondo" || id === "strength") && entry.durationMin) {
    return `${entry.durationMin} min${entry.rpe ? ` · rpe ${entry.rpe}` : ""}`;
  }
  return null;
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
  checkDone: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
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
  kcal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,90,60,0.08)",
  },
  kcalText: { fontFamily: fonts.mono, fontSize: 11, color: colors.accent },
  chev: { marginLeft: 4 },
});
