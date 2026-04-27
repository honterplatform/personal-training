import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { isoToDate, monthLong, todayISO, weekday } from "../lib/dates";
import { colors, fonts } from "../lib/theme";
import { FlameIcon } from "./Icons";

export default function DatePicker({
  value,
  onChange,
  dayKcal,
}: {
  value: string;
  onChange: (iso: string) => void;
  dayKcal: number;
}) {
  const [open, setOpen] = useState(false);
  const [tmp, setTmp] = useState<Date>(isoToDate(value));
  const today = todayISO();
  const isToday = value === today;
  const dayNum = Number(value.slice(8, 10));
  const month = monthLong(value).toLowerCase();
  const year = value.slice(0, 4);

  function commit(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const iso = `${y}-${m}-${d}`;
    onChange(iso);
  }

  function onPickerChange(_e: DateTimePickerEvent, selected?: Date) {
    if (selected) setTmp(selected);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable onPress={() => { setTmp(isoToDate(value)); setOpen(true); }}>
          <Text style={styles.weekday}>{weekday(value)}</Text>
        </Pressable>
        <Text style={styles.iso}>
          {String(dayNum).padStart(2, "0")} {month} {year}
        </Text>
        {!isToday && (
          <Pressable onPress={() => onChange(today)} style={styles.todayBtn}>
            <Text style={styles.todayBtnText}>→ today</Text>
          </Pressable>
        )}
      </View>
      {dayKcal > 0 && (
        <View style={styles.kcal}>
          <FlameIcon size={12} color={colors.accent} strokeWidth={2} />
          <Text style={styles.kcalText}>{dayKcal.toLocaleString()} kcal burned</Text>
        </View>
      )}

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.grabber} />
            <DateTimePicker
              value={tmp}
              mode="date"
              display="inline"
              maximumDate={new Date()}
              onChange={onPickerChange}
              accentColor={colors.accent}
              themeVariant="light"
            />
            <View style={styles.actions}>
              <Pressable onPress={() => setOpen(false)} style={styles.cancel}>
                <Text style={styles.cancelText}>cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => { commit(tmp); setOpen(false); }}
                style={styles.confirm}
              >
                <Text style={styles.confirmText}>select</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 14 },
  row: { flexDirection: "row", alignItems: "baseline", gap: 10, flexWrap: "wrap" },
  weekday: {
    fontFamily: fonts.serif,
    fontSize: 38,
    lineHeight: 40,
    color: colors.ink,
    letterSpacing: -1,
  },
  iso: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.mutedInk,
    letterSpacing: 0.2,
  },
  todayBtn: {
    marginLeft: "auto",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.creamTint,
  },
  todayBtnText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: "rgba(26,23,22,0.7)",
    letterSpacing: 0.4,
  },
  kcal: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,90,60,0.08)",
  },
  kcalText: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    color: colors.accent,
    letterSpacing: 0.2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(23,20,15,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingBottom: 30,
    paddingTop: 12,
  },
  grabber: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(26,23,22,0.15)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 6 },
  cancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.creamTint,
    alignItems: "center",
  },
  cancelText: { fontFamily: fonts.sansSemibold, fontSize: 14, color: colors.ink },
  confirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.inkDark,
    alignItems: "center",
  },
  confirmText: { fontFamily: fonts.sansSemibold, fontSize: 14, color: colors.cream },
});
