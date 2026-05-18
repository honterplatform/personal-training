import { useState } from "react";
import { useStore } from "../lib/store.jsx";
import Header from "./Header.jsx";
import WeeklyHero from "./WeeklyHero.jsx";
import DateSelector from "./DateSelector.jsx";
import WeightCard from "./WeightCard.jsx";
import MeasurementCard from "./MeasurementCard.jsx";
import NutritionCard from "./NutritionCard.jsx";
import PhotoCard from "./PhotoCard.jsx";
import InsightsStrip from "./InsightsStrip.jsx";
import TrackerCard from "./TrackerCard.jsx";
import SettingsSheet from "./SettingsSheet.jsx";
import CoachChat from "./CoachChat.jsx";
import WeeklyReview from "./WeeklyReview.jsx";

export default function HomeScreen() {
  const { trackers, weekEntries, selectedDate, setSelectedDate } = useStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const dayEntries = weekEntries.filter((e) => e.date === selectedDate);
  const dayKcal = dayEntries.reduce((s, e) => s + (e.caloriesBurned ?? 0), 0);

  return (
    <div className="app-shell">
      <div className="shell-inner">
        <Header
          onOpenSettings={() => setShowSettings(true)}
          onOpenReview={() => setShowReview(true)}
        />

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

        <InsightsStrip />

        <WeightCard />
        <MeasurementCard />
        <NutritionCard />
        <PhotoCard />

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
      {showReview && <WeeklyReview onClose={() => setShowReview(false)} />}
    </div>
  );
}
