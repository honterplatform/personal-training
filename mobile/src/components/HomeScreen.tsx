import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "./Header";
import WeeklyHero from "./WeeklyHero";
import DatePicker from "./DatePicker";
import Checklist from "./Checklist";
import SettingsSheet from "./SettingsSheet";
import CoachChat from "./CoachChat";
import { useStore } from "../lib/store";
import { colors } from "../lib/theme";

export default function HomeScreen() {
  const { selectedDate, setSelectedDate, weekEntries } = useStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const dayEntries = weekEntries.filter((e) => e.date === selectedDate);
  const dayKcal = dayEntries.reduce((s, e) => s + (e.caloriesBurned ?? 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Header onOpenSettings={() => setShowSettings(true)} />
          <View style={styles.heroPad}>
            <WeeklyHero
              selectedDate={selectedDate}
              weekEntries={weekEntries}
              onSelectDate={setSelectedDate}
              onOpenCoach={() => setShowCoach(true)}
            />
          </View>
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            dayKcal={dayKcal}
          />
          <View style={styles.checklistPad}>
            <Checklist date={selectedDate} entries={dayEntries} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SettingsSheet visible={showSettings} onClose={() => setShowSettings(false)} />
      <CoachChat visible={showCoach} onClose={() => setShowCoach(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1 },
  scroll: { paddingBottom: 60 },
  heroPad: { paddingHorizontal: 16, paddingTop: 14 },
  checklistPad: { paddingHorizontal: 16 },
});
