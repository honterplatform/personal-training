import { useState } from "react";
import { useStore } from "../lib/store.jsx";
import Header from "./Header.jsx";
import WeeklyHero from "./WeeklyHero.jsx";
import DateSelector from "./DateSelector.jsx";
import WeightCard from "./WeightCard.jsx";
import NutritionCard from "./NutritionCard.jsx";
import TrackerCard from "./TrackerCard.jsx";
import SettingsSheet from "./SettingsSheet.jsx";
import CoachChat from "./CoachChat.jsx";

export default function HomeScreen() {
  const { trackers, weekEntries, selectedDate, setSelectedDate } = useStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showCoach, setShowCoach] = useState(false);

  const dayEntries = weekEntries.filter((e) => e.date === selectedDate);
  const dayKcal = dayEntries.reduce((s, e) => s + (e.caloriesBurned ?? 0), 0);

  return (
    <div className="app-shell">
      <div className="shell-inner">
        <Header onOpenSettings={() => setShowSettings(true)} />

        <WeeklyHero
          trackers={trackers}
          weekEntries={weekEntries}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onOpenCoach={() => setShowCoach(true)}
        />

        <DateSelector
          value={selectedDate}
          onChange={setSelectedDate}
          dayKcal={dayKcal}
        />

        <WeightCard />
        <NutritionCard />

        {trackers.length === 0 ? (
          <div className="empty-trackers">
            No trackers yet. Add some in settings.
          </div>
        ) : (
          <div className="trackers-list">
            {trackers.map((t) => (
              <TrackerCard
                key={t._id}
                tracker={t}
                dayEntries={dayEntries}
                date={selectedDate}
              />
            ))}
          </div>
        )}
      </div>

      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
      {showCoach && <CoachChat onClose={() => setShowCoach(false)} />}
    </div>
  );
}
