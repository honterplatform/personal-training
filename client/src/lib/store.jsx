import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, APIError } from "./api.js";
import { todayISO, weekRange } from "./dates.js";

const StoreContext = createContext(null);

function sortTrackers(a, b) {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  return a.order - b.order;
}

export function StoreProvider({ children }) {
  const [authState, setAuthState] = useState("loading");
  const [user, setUser] = useState(null);
  const [trackers, setTrackers] = useState([]);
  const [weekEntries, setWeekEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [error, setError] = useState(null);

  const settle = useCallback((u) => {
    if (!u) {
      setUser(null);
      setTrackers([]);
      setWeekEntries([]);
      setAuthState("signedOut");
      return;
    }
    setUser(u);
    setAuthState(u.onboardedAt ? "ready" : "needsOnboarding");
  }, []);

  const boot = useCallback(async () => {
    try {
      const { user } = await api.me();
      settle(user);
    } catch (e) {
      if (e instanceof APIError && e.status === 401) settle(null);
      else { settle(null); if (e instanceof Error) setError(e.message); }
    }
  }, [settle]);

  const refreshTrackers = useCallback(async () => {
    try { setTrackers(await api.listTrackers()); }
    catch (e) {
      if (e instanceof APIError && e.status === 401) settle(null);
      else if (e instanceof Error) setError(e.message);
    }
  }, [settle]);

  const refreshWeek = useCallback(async () => {
    try {
      const { start, end } = weekRange(selectedDate);
      setWeekEntries(await api.listEntries(start, end));
    } catch (e) {
      if (e instanceof APIError && e.status === 401) settle(null);
      else if (e instanceof Error) setError(e.message);
    }
  }, [selectedDate, settle]);

  useEffect(() => { boot(); }, [boot]);

  useEffect(() => {
    if (authState === "ready") {
      refreshTrackers();
      refreshWeek();
    }
  }, [authState, refreshTrackers, refreshWeek]);

  useEffect(() => {
    if (authState === "ready") refreshWeek();
  }, [selectedDate, authState, refreshWeek]);

  const signup = useCallback(async (email, password, displayName) => {
    const { user } = await api.signup({ email, password, displayName });
    settle(user);
  }, [settle]);

  const login = useCallback(async (email, password) => {
    const { user } = await api.login({ email, password });
    settle(user);
  }, [settle]);

  const signOut = useCallback(async () => {
    try { await api.logout(); } catch {}
    settle(null);
  }, [settle]);

  const deleteAccount = useCallback(async () => {
    await api.deleteMe();
    settle(null);
  }, [settle]);

  const updateProfile = useCallback(async (patch) => {
    const { user } = await api.updateMe(patch);
    settle(user);
  }, [settle]);

  const createTracker = useCallback(async (body) => {
    const t = await api.createTracker(body);
    setTrackers((prev) => [...prev, t].sort(sortTrackers));
    return t;
  }, []);

  const updateTracker = useCallback(async (id, body) => {
    const u = await api.updateTracker(id, body);
    setTrackers((prev) => prev.map((t) => (t._id === id ? u : t)).sort(sortTrackers));
  }, []);

  const deleteTrackerCb = useCallback(async (id) => {
    await api.deleteTracker(id);
    setTrackers((prev) => prev.filter((t) => t._id !== id));
    setWeekEntries((prev) => prev.filter((e) => e.trackerId !== id));
  }, []);

  const createEntry = useCallback(async (body) => {
    const e = await api.createEntry(body);
    await refreshWeek();
    return e;
  }, [refreshWeek]);

  const updateEntryCb = useCallback(async (id, body) => {
    await api.updateEntry(id, body);
    await refreshWeek();
  }, [refreshWeek]);

  const deleteEntryCb = useCallback(async (id) => {
    await api.deleteEntry(id);
    await refreshWeek();
  }, [refreshWeek]);

  const value = useMemo(() => ({
    state: authState, user, trackers, weekEntries, selectedDate, error,
    setSelectedDate,
    signup, login, signOut, deleteAccount, updateProfile,
    refreshTrackers, refreshWeek,
    createTracker, updateTracker, deleteTracker: deleteTrackerCb,
    createEntry, updateEntry: updateEntryCb, deleteEntry: deleteEntryCb,
  }), [
    authState, user, trackers, weekEntries, selectedDate, error,
    signup, login, signOut, deleteAccount, updateProfile,
    refreshTrackers, refreshWeek,
    createTracker, updateTracker, deleteTrackerCb,
    createEntry, updateEntryCb, deleteEntryCb,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const c = useContext(StoreContext);
  if (!c) throw new Error("useStore outside StoreProvider");
  return c;
}
