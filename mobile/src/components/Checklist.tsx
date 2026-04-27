import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import ActivityRow from "./ActivityRow";
import ProteinRow from "./ProteinRow";
import { useStore } from "../lib/store";
import { colors, fonts } from "../lib/theme";
import type { Entry } from "../lib/api";

const ORDER: Entry["activity"][] = ["walk", "squash", "taekwondo", "strength", "protein"];

export default function Checklist({
  date,
  entries,
}: {
  date: string;
  entries: Entry[];
}) {
  const { settings, saveEntry, deleteEntry } = useStore();
  const [openRow, setOpenRow] = useState<string | null>(null);

  const byActivity = Object.fromEntries(entries.map((e) => [e.activity, e])) as Record<
    Entry["activity"],
    Entry | undefined
  >;
  const goal = settings.proteinGoalG ?? 150;

  return (
    <View>
      {ORDER.map((a) => {
        const entry = byActivity[a];
        const isOpen = openRow === a;
        const onToggleOpen = () => setOpenRow(isOpen ? null : a);

        if (a === "protein") {
          return (
            <ProteinRow
              key={a}
              entry={entry}
              goal={goal}
              open={isOpen}
              onToggleOpen={onToggleOpen}
              onSave={(patch) => saveEntry(date, a, patch)}
              onDelete={() => deleteEntry(date, a)}
            />
          );
        }

        return (
          <ActivityRow
            key={a}
            activity={a as Exclude<Entry["activity"], "protein">}
            entry={entry}
            open={isOpen}
            onToggleOpen={onToggleOpen}
            onSave={(patch) => saveEntry(date, a, patch)}
            onDelete={() => deleteEntry(date, a)}
          />
        );
      })}
      <Text style={styles.eod}>· end of day ·</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eod: {
    marginTop: 14,
    textAlign: "center",
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: "rgba(26,23,22,0.3)",
    textTransform: "uppercase",
  },
});
