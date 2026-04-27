import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "./Header";
import DatePicker from "./DatePicker";
import Checklist from "./Checklist";
import { useStore } from "../lib/store";
import { colors } from "../lib/theme";

export default function HomeScreen() {
  const { selectedDate, setSelectedDate, weekEntries } = useStore();
  const dayEntries = weekEntries.filter((e) => e.date === selectedDate);
  const dayKcal = dayEntries.reduce((s, e) => s + (e.caloriesBurned ?? 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Header onOpenSettings={() => {}} />
        <View style={styles.heroPlaceholder} />
        <DatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          dayKcal={dayKcal}
        />
        <View style={styles.checklistPad}>
          <Checklist date={selectedDate} entries={dayEntries} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingBottom: 60 },
  heroPlaceholder: { height: 8 },
  checklistPad: { paddingHorizontal: 16 },
});
