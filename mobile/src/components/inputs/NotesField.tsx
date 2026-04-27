import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fonts } from "../../lib/theme";
import { NoteIcon } from "../Icons";

export default function NotesField({
  value,
  onChangeText,
  onCommit,
}: {
  value: string;
  onChangeText: (s: string) => void;
  onCommit: () => void;
}) {
  const [open, setOpen] = useState<boolean>(!!value);
  const trigger = open ? "notes" : value ? "notes" : "+ notes";
  return (
    <View>
      <Pressable onPress={() => setOpen(!open)} style={styles.trigger}>
        <NoteIcon size={12} color={colors.mutedInk} strokeWidth={2} />
        <Text style={styles.triggerText}>{trigger}</Text>
      </Pressable>
      {open ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onBlur={onCommit}
          placeholder="how did it feel?"
          placeholderTextColor="rgba(26,23,22,0.3)"
          multiline
          style={styles.area}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: { flexDirection: "row", alignItems: "center", gap: 6 },
  triggerText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.mutedInk,
    textTransform: "uppercase",
  },
  area: {
    marginTop: 8,
    minHeight: 60,
    padding: 12,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: "rgba(26,23,22,0.05)",
    borderRadius: 12,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
    lineHeight: 22,
    textAlignVertical: "top",
  },
});
