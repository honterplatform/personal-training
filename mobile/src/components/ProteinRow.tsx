import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fonts } from "../lib/theme";
import { CheckIcon, ChevDown, ProteinIcon } from "./Icons";
import NotesField from "./inputs/NotesField";
import type { Entry } from "../lib/api";

type Props = {
  entry?: Entry;
  goal: number;
  open: boolean;
  onToggleOpen: () => void;
  onSave: (patch: Partial<Entry>) => void;
  onDelete: () => void;
};

export default function ProteinRow({ entry, goal, open, onToggleOpen, onSave, onDelete }: Props) {
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
          onPress={(e) => {
            e.stopPropagation();
            onSave({
              done: !done,
              proteinG: entry?.proteinG ?? null,
              notes: entry?.notes ?? "",
            });
          }}
          style={[styles.check, done && styles.checkDone]}
        >
          {done ? <CheckIcon size={15} color="#fff" strokeWidth={2.5} /> : null}
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

      {open ? (
        <View style={styles.body}>
          <Body entry={entry} goal={goal} onSave={onSave} onDelete={onDelete} />
        </View>
      ) : null}
    </View>
  );
}

function Body({
  entry,
  goal,
  onSave,
  onDelete,
}: {
  entry?: Entry;
  goal: number;
  onSave: (patch: Partial<Entry>) => void;
  onDelete: () => void;
}) {
  const [proteinG, setG] = useState<string>(entry?.proteinG != null ? String(entry.proteinG) : "");
  const [notes, setNotes] = useState(entry?.notes ?? "");

  useEffect(() => {
    setG(entry?.proteinG != null ? String(entry.proteinG) : "");
    setNotes(entry?.notes ?? "");
  }, [entry?._id, entry?.updatedAt]);

  function commit(patch: Partial<Entry> = {}) {
    const num = patch.proteinG != null ? patch.proteinG : (proteinG === "" ? null : Number(proteinG));
    const auto = num != null && goal > 0 && num >= goal;
    onSave({
      done: patch.done ?? (auto || !!entry?.done),
      proteinG: num,
      notes: patch.notes ?? notes,
    });
  }

  function quickAdd(inc: number) {
    const cur = Number(proteinG) || 0;
    const next = cur + inc;
    setG(String(next));
    commit({ proteinG: next });
  }

  const numG = Number(proteinG) || 0;
  const pct = Math.min(1, goal > 0 ? numG / goal : 0);

  return (
    <View style={{ gap: 14 }}>
      <View>
        <View style={styles.headRow}>
          <Text style={styles.label}>intake</Text>
          <Text style={[styles.right, { color: numG >= goal ? colors.accent : "rgba(26,23,22,0.4)" }]}>
            {numG}/{goal}g
          </Text>
        </View>
        <View style={styles.bigField}>
          <TextInput
            value={proteinG}
            onChangeText={setG}
            onBlur={() => commit()}
            placeholder="0"
            placeholderTextColor="rgba(26,23,22,0.3)"
            keyboardType="number-pad"
            style={styles.bigInput}
          />
          <Text style={styles.unit}>grams</Text>
        </View>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              { width: `${pct * 100}%`, backgroundColor: numG >= goal ? colors.accent : colors.inkDark },
            ]}
          />
        </View>
        <View style={styles.quickRow}>
          {[25, 50, 100, 150].map((inc) => (
            <Pressable key={inc} onPress={() => quickAdd(inc)} style={styles.quick}>
              <Text style={styles.quickText}>+{inc}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <NotesField value={notes} onChangeText={setNotes} onCommit={() => commit()} />

      {entry?._id ? (
        <Pressable onPress={onDelete} hitSlop={6} style={styles.clear}>
          <Text style={styles.clearText}>clear entry</Text>
        </Pressable>
      ) : null}
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
  body: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(26,23,22,0.06)",
  },
  headRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10.5,
    letterSpacing: 0.5,
    color: colors.mutedInk,
    textTransform: "uppercase",
  },
  right: { fontFamily: fonts.monoMedium, fontSize: 11 },
  bigField: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    backgroundColor: colors.cream,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(26,23,22,0.05)",
  },
  bigInput: {
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: 32,
    color: colors.ink,
    letterSpacing: -0.8,
    padding: 0,
  },
  unit: { fontFamily: fonts.mono, fontSize: 14, color: "rgba(26,23,22,0.5)" },
  barTrack: {
    marginTop: 10,
    height: 6,
    backgroundColor: colors.cream,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: { height: 6 },
  quickRow: { flexDirection: "row", gap: 6, marginTop: 10 },
  quick: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: colors.cream,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(26,23,22,0.04)",
  },
  quickText: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    color: "rgba(26,23,22,0.7)",
  },
  clear: { alignSelf: "flex-start", marginTop: 4 },
  clearText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: "rgba(26,23,22,0.45)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
