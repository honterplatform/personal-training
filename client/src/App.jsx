import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import { todayISO, weekRange, weekStartISO } from "./lib/dates.js";
import Login from "./components/Login.jsx";
import Header from "./components/Header.jsx";
import WeeklyStrip from "./components/WeeklyStrip.jsx";
import DatePicker from "./components/DatePicker.jsx";
import Checklist from "./components/Checklist.jsx";
import Settings from "./components/Settings.jsx";

export default function App() {
  const [authed, setAuthed] = useState(true);
  const [booted, setBooted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [settings, setSettings] = useState(null);
  const [weekEntries, setWeekEntries] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryWeek, setSummaryWeek] = useState(null);
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

  useEffect(() => {
    if (!authed || !booted) return;
    const ws = weekStartISO(selectedDate);
    if (ws === summaryWeek) return;
    setSummaryWeek(ws);
    setSummary(null);
    setSummaryOpen(false);
    api
      .getSummary(ws)
      .then((s) => {
        if (s?.text) setSummary(s.text);
      })
      .catch(() => {});
  }, [selectedDate, authed, booted, summaryWeek]);

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

  async function handleSummaryToggle() {
    if (summaryOpen) {
      setSummaryOpen(false);
      return;
    }
    const ws = weekStartISO(selectedDate);
    setSummaryOpen(true);
    if (summary) return;
    setSummaryLoading(true);
    try {
      const s = await api.generateSummary(ws);
      setSummary(s.text);
    } catch {
      setSummary("Summary unavailable, try again in a moment.");
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleSummaryRegenerate() {
    const ws = weekStartISO(selectedDate);
    setSummaryLoading(true);
    setSummary(null);
    try {
      const s = await api.generateSummary(ws);
      setSummary(s.text);
    } catch {
      setSummary("Summary unavailable, try again in a moment.");
    } finally {
      setSummaryLoading(false);
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
              summary={summary}
              summaryOpen={summaryOpen}
              summaryLoading={summaryLoading}
              onSummaryToggle={handleSummaryToggle}
              onSummaryRegenerate={handleSummaryRegenerate}
            />
          </div>

          <div className="day-col">
            <DatePicker value={selectedDate} onChange={setSelectedDate} />
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
    </div>
  );
}
