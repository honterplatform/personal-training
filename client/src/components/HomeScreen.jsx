import { useState } from "react";
import { useStore } from "../lib/store.jsx";
import Header from "./Header.jsx";
import WeeklyHero from "./WeeklyHero.jsx";
import DateSelector from "./DateSelector.jsx";
import TrackerCard from "./TrackerCard.jsx";

export default function HomeScreen() {
  const {
    trackers, weekEntries, selectedDate, setSelectedDate,
    signOut,
  } = useStore();
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

        {/* Temp until Phase 4 settings sheet */}
        {showSettings ? (
          <div className="modal-backdrop" onClick={() => setShowSettings(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h2>settings coming next phase</h2>
              <button className="entry-submit" onClick={signOut}>log out</button>
              <button className="entry-cancel" onClick={() => setShowSettings(false)}>
                close
              </button>
            </div>
          </div>
        ) : null}

        {/* Temp until Phase 5 coach chat */}
        {showCoach ? (
          <div className="modal-backdrop" onClick={() => setShowCoach(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h2>coach chat coming next phase</h2>
              <button className="entry-cancel" onClick={() => setShowCoach(false)}>
                close
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
