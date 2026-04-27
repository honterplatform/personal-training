import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../lib/theme";
import { GearIcon } from "./Icons";

export default function Header({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <Text style={styles.mark}>LOG</Text>
        <View style={styles.divider} />
        <Text style={styles.tag}>training{"\n"}daily</Text>
      </View>
      <Pressable
        onPress={onOpenSettings}
        style={({ pressed }) => [styles.gear, pressed && { opacity: 0.7 }]}
        accessibilityLabel="Settings"
      >
        <GearIcon size={17} color={colors.mutedInk} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 14,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 14 },
  mark: {
    fontFamily: fonts.serif,
    fontSize: 34,
    lineHeight: 36,
    color: colors.ink,
    letterSpacing: -1,
  },
  divider: { width: 1, height: 22, backgroundColor: "rgba(26,23,22,0.15)" },
  tag: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    lineHeight: 12,
    letterSpacing: 1.5,
    color: "rgba(26,23,22,0.5)",
    textTransform: "uppercase",
  },
  gear: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(26,23,22,0.06)",
  },
});
