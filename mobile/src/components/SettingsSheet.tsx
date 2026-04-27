import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, fonts } from "../lib/theme";
import { XIcon } from "./Icons";
import { useStore } from "../lib/store";
import type { AppSettings } from "../lib/api";

export default function SettingsSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { settings, saveSettings } = useStore();
  const [bw, setBw] = useState(toStr(settings.bodyWeightKg));
  const [pg, setPg] = useState(toStr(settings.proteinGoalG));
  const [age, setAge] = useState(toStr(settings.age));
  const [sex, setSex] = useState<string>(settings.sex ?? "");
  const [fitness, setFitness] = useState<string>(settings.fitnessLevel ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setBw(toStr(settings.bodyWeightKg));
    setPg(toStr(settings.proteinGoalG));
    setAge(toStr(settings.age));
    setSex(settings.sex ?? "");
    setFitness(settings.fitnessLevel ?? "");
  }, [visible, settings]);

  async function save() {
    setSaving(true);
    try {
      const next: AppSettings = {
        bodyWeightKg: bw === "" ? null : Number(bw),
        proteinGoalG: pg === "" ? null : Number(pg),
        age: age === "" ? null : Number(age),
        sex: sex || null,
        fitnessLevel: fitness || null,
      };
      await saveSettings(next);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={20}
          >
            <View style={styles.grabber} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>Settings</Text>
              <Pressable onPress={onClose} style={styles.close}>
                <XIcon size={16} color={colors.ink} strokeWidth={1.8} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 520 }} keyboardShouldPersistTaps="handled">
              <View style={{ gap: 14 }}>
                <Field label="body weight" unit="kg" value={bw} onChange={setBw} />
                <Field label="daily protein goal" unit="g" value={pg} onChange={setPg} />
                <Field label="age" unit="yrs" value={age} onChange={setAge} placeholder="e.g. 32" />

                <Pills
                  label="sex"
                  value={sex}
                  onChange={setSex}
                  options={[
                    { id: "male", label: "male" },
                    { id: "female", label: "female" },
                    { id: "other", label: "other" },
                  ]}
                />
                <Pills
                  label="fitness level"
                  hint="used to refine calorie estimates"
                  value={fitness}
                  onChange={setFitness}
                  options={[
                    { id: "beginner", label: "beginner" },
                    { id: "intermediate", label: "intermediate" },
                    { id: "advanced", label: "advanced" },
                  ]}
                />
              </View>
            </ScrollView>

            <Pressable
              onPress={save}
              disabled={saving}
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            >
              <Text style={styles.saveBtnText}>{saving ? "saving…" : "save"}</Text>
            </Pressable>

            <View style={styles.footRow}>
              <Text style={styles.foot}>v1.0</Text>
              <Text style={styles.foot}>america/bogotá</Text>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Field({
  label,
  unit,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  unit?: string;
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.fieldBox}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="rgba(26,23,22,0.3)"
          keyboardType="decimal-pad"
          style={styles.fieldInput}
        />
        {unit ? <Text style={styles.fieldUnit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

function Pills({
  label,
  hint,
  value,
  onChange,
  options,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (id: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <View>
      <Text style={[styles.label, { marginBottom: hint ? 2 : 6 }]}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.pillRow}>
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => onChange(active ? "" : opt.id)}
              style={[
                styles.pill,
                active ? { backgroundColor: colors.accent, borderColor: "transparent" } : styles.pillIdle,
              ]}
            >
              <Text style={[styles.pillText, active && { color: "#fff" }]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function toStr(n: number | null | undefined): string {
  return n == null ? "" : String(n);
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(23,20,15,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 30,
  },
  grabber: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(26,23,22,0.15)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 32,
    color: colors.ink,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.creamTint,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10.5,
    letterSpacing: 0.5,
    color: colors.mutedInk,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: "rgba(26,23,22,0.45)",
    marginBottom: 6,
    lineHeight: 15,
  },
  fieldBox: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(26,23,22,0.06)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  fieldInput: {
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: 26,
    color: colors.ink,
    letterSpacing: -0.5,
    padding: 0,
  },
  fieldUnit: { fontFamily: fonts.mono, fontSize: 13, color: colors.mutedInk },
  pillRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  pill: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  pillIdle: {
    backgroundColor: colors.card,
    borderColor: "rgba(26,23,22,0.06)",
  },
  pillText: {
    fontFamily: fonts.sansSemibold,
    fontSize: 13,
    color: "rgba(26,23,22,0.7)",
    letterSpacing: -0.1,
  },
  saveBtn: {
    marginTop: 22,
    paddingVertical: 15,
    backgroundColor: colors.inkDark,
    borderRadius: 16,
    alignItems: "center",
  },
  saveBtnText: {
    fontFamily: fonts.sansSemibold,
    fontSize: 14,
    color: colors.cream,
  },
  footRow: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(26,23,22,0.08)",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  foot: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: "rgba(26,23,22,0.4)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
