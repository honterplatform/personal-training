import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../lib/theme";
import {
  CheckIcon,
  ChevDown,
  FlameIcon,
  StrengthIcon,
  SquashIcon,
  TkdIcon,
  WalkIcon,
} from "./Icons";
import NumField from "./inputs/NumField";
import RPEGrid from "./inputs/RPEGrid";
import NotesField from "./inputs/NotesField";
import StrengthReference from "./StrengthReference";
import type { Entry } from "../lib/api";

const META: Record<
  Exclude<Entry["activity"], "protein">,
  {
    name: string;
    target: string;
    Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
    showsDistance: boolean;
    durationPlaceholder: string;
  }
> = {
  walk:      { name: "Walk",      target: "≥6 km",   Icon: WalkIcon,     showsDistance: true,  durationPlaceholder: "60" },
  squash:    { name: "Squash",    target: "60 min",  Icon: SquashIcon,   showsDistance: false, durationPlaceholder: "45" },
  taekwondo: { name: "Taekwondo", target: "60 min",  Icon: TkdIcon,      showsDistance: false, durationPlaceholder: "60" },
  strength:  { name: "Strength",  target: "8 moves", Icon: StrengthIcon, showsDistance: false, durationPlaceholder: "60" },
};

type Props = {
  activity: Exclude<Entry["activity"], "protein">;
  entry?: Entry;
  open: boolean;
  onToggleOpen: () => void;
  onSave: (patch: Partial<Entry>) => void;
  onDelete: () => void;
};

export default function ActivityRow({ activity, entry, open, onToggleOpen, onSave, onDelete }: Props) {
  const meta = META[activity];
  const done = !!entry?.done;
  const Icon = meta.Icon;
  const needsDuration = done && !entry?.durationMin;
  const subtitle = needsDuration
    ? "add duration for kcal estimate"
    : describe(activity, entry) || meta.target;

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onToggleOpen}
        style={({ pressed }) => [styles.head, pressed && { opacity: 0.85 }]}
      >
        <Pressable
          hitSlop={10}
          onPress={(e) => {
            e.stopPropagation();
            const next = !done;
            onSave({ done: next });
            if (next && !entry?.durationMin && !open) onToggleOpen();
          }}
          style={[styles.check, done && styles.checkDone]}
        >
          {done ? <CheckIcon size={15} color="#fff" strokeWidth={2.5} /> : null}
        </Pressable>
        <View style={[styles.iconTile, done && { backgroundColor: "rgba(255,90,60,0.08)" }]}>
          <Icon size={20} color={done ? colors.accent : colors.ink} strokeWidth={1.8} />
        </View>
        <View style={styles.center}>
          <Text style={[styles.name, done && styles.nameDone]}>{meta.name}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
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

      {open ? (
        <View style={styles.body}>
          <Body activity={activity} entry={entry} onSave={onSave} onDelete={onDelete} />
        </View>
      ) : null}
    </View>
  );
}

function Body({
  activity,
  entry,
  onSave,
  onDelete,
}: {
  activity: Exclude<Entry["activity"], "protein">;
  entry?: Entry;
  onSave: (patch: Partial<Entry>) => void;
  onDelete: () => void;
}) {
  const meta = META[activity];
  const [distance, setDistance] = useState(toStr(entry?.distanceKm));
  const [duration, setDuration] = useState(toStr(entry?.durationMin));
  const [rpe, setRpe] = useState<number | null>(entry?.rpe ?? null);
  const [notes, setNotes] = useState(entry?.notes ?? "");

  useEffect(() => {
    setDistance(toStr(entry?.distanceKm));
    setDuration(toStr(entry?.durationMin));
    setRpe(entry?.rpe ?? null);
    setNotes(entry?.notes ?? "");
  }, [entry?._id, entry?.updatedAt]);

  function commit(patch: Partial<Entry> = {}) {
    onSave({
      distanceKm: patch.distanceKm ?? toNum(distance),
      durationMin: patch.durationMin ?? toNum(duration),
      rpe: patch.rpe ?? rpe,
      notes: patch.notes ?? notes,
    });
  }

  return (
    <View style={{ gap: 14 }}>
      <View style={styles.fieldsRow}>
        {meta.showsDistance ? (
          <NumField
            label="distance"
            unit="km"
            value={distance}
            onChangeText={setDistance}
            onCommit={() => commit()}
            placeholder="6.0"
          />
        ) : null}
        <NumField
          label="duration"
          unit="min"
          value={duration}
          onChangeText={setDuration}
          onCommit={() => commit()}
          placeholder={meta.durationPlaceholder}
        />
      </View>

      <RPEGrid
        value={rpe}
        onChange={(v) => {
          setRpe(v);
          commit({ rpe: v });
        }}
      />

      <NotesField
        value={notes}
        onChangeText={setNotes}
        onCommit={() => commit()}
      />

      {activity === "strength" ? <StrengthReference /> : null}

      {entry?._id ? (
        <Pressable onPress={onDelete} hitSlop={6} style={styles.clear}>
          <Text style={styles.clearText}>clear entry</Text>
        </Pressable>
      ) : null}
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

function toStr(n: number | null | undefined): string {
  return n == null ? "" : String(n);
}
function toNum(s: string): number | null {
  if (s === "" || s == null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
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
  body: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(26,23,22,0.06)",
  },
  fieldsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  clear: { alignSelf: "flex-start", marginTop: 4 },
  clearText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: "rgba(26,23,22,0.45)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
