import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fonts } from "../../lib/theme";

export default function NumField({
  label,
  unit,
  value,
  onChangeText,
  onCommit,
  placeholder,
}: {
  label: string;
  unit?: string;
  value: string;
  onChangeText: (s: string) => void;
  onCommit: () => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.box}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onBlur={onCommit}
          placeholder={placeholder}
          placeholderTextColor="rgba(26,23,22,0.3)"
          keyboardType="decimal-pad"
          style={styles.input}
        />
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, minWidth: 0 },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10.5,
    letterSpacing: 0.5,
    color: colors.mutedInk,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  box: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: colors.cream,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(26,23,22,0.05)",
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.ink,
    letterSpacing: -0.3,
    padding: 0,
  },
  unit: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: "rgba(26,23,22,0.45)",
    marginLeft: 4,
  },
});
