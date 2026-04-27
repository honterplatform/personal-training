import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import { todayISO, weekRange } from "./lib/dates.js";
import Login from "./components/Login.jsx";
import Header from "./components/Header.jsx";
import WeeklyStrip from "./components/WeeklyStrip.jsx";
import DatePicker from "./components/DatePicker.jsx";
import Checklist from "./components/Checklist.jsx";
import Settings from "./components/Settings.jsx";
import CoachChat from "./components/CoachChat.jsx";

export default function App() {
  const [authed, setAuthed] = useState(true);
  const [booted, setBooted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [settings, setSettings] = useState(null);
  const [weekEntries, setWeekEntries] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [error, setError] = useState("");

  const refreshWeek = useCallback(async (date) => {
    const { start, end } = weekRange(date);
    try {
      const list = await api.getEntries(start, end);
      setWeekEntries(list);
    } catch (e) {
      if (e.status === 401) setAuthed(false);
      else setError(e.message);
    }
  }, []);

  const boot = useCallback(async () => {
    try {
      const s = await api.getSettings();
      setSettings(s);
      await refreshWeek(selectedDate);
      setAuthed(true);
    } catch (e) {
      if (e.status === 401) setAuthed(false);
      else setError(e.message);
    } finally {
      setBooted(true);
    }
  }, [refreshWeek, selectedDate]);

  useEffect(() => {
    boot();
  }, []);

  useEffect(() => {
    if (authed && booted) refreshWeek(selectedDate);
  }, [selectedDate, authed, booted, refreshWeek]);

  async function handleSave(date, activity, body) {
    try {
      await api.saveEntry(date, activity, body);
      await refreshWeek(selectedDate);
    } catch (e) {
      if (e.status === 401) setAuthed(false);
      else setError(e.message);
    }
  }

  async function handleDelete(date, activity) {
    try {
      await api.deleteEntry(date, activity);
      await refreshWeek(selectedDate);
    } catch (e) {
      if (e.status === 401) setAuthed(false);
      else setError(e.message);
    }
  }

  if (!booted) {
    return (
      <div className="app-shell" style={{ padding: 40, color: "rgba(26,23,22,0.4)" }}>
        loading…
      </div>
    );
  }

  if (!authed) {
    return <Login onSuccess={() => { setAuthed(true); boot(); }} />;
  }

  const dateEntries = weekEntries.filter((e) => e.date === selectedDate);
  const dayKcal = dateEntries.reduce((sum, e) => sum + (Number(e.caloriesBurned) || 0), 0);

  return (
    <div className="app-shell">
      <div className="shell-inner">
        <Header onOpenSettings={() => setShowSettings(true)} />

        <div className="layout responsive-pad">
          <div className="hero-col">
            <WeeklyStrip
              selectedDate={selectedDate}
              weekEntries={weekEntries}
              onSelectDate={setSelectedDate}
              onOpenCoach={() => setShowCoach(true)}
            />
          </div>

          <div className="day-col">
            <DatePicker value={selectedDate} onChange={setSelectedDate} dayKcal={dayKcal} />
            <Checklist
              date={selectedDate}
              entries={dateEntries}
              proteinGoal={settings?.proteinGoalG ?? 150}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: "0 22px 40px",
              fontSize: 11,
              color: "#ff5a3c",
              fontFamily: "var(--mono)",
            }}
          >
            error: {error}
          </div>
        )}
      </div>

      {showSettings && (
        <Settings
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSaved={(s) => setSettings(s)}
        />
      )}

      <CoachChat
        open={showCoach}
        onClose={() => setShowCoach(false)}
        selectedDate={selectedDate}
      />
    </div>
  );
}
