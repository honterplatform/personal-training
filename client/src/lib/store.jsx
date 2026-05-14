import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { createAPI, APIError } from "./api.js";
import { todayISO, weekRange } from "./dates.js";

const StoreContext = createContext(null);

function sortTrackers(a, b) {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  return a.order - b.order;
}

export function StoreProvider({ children }) {
  const { isLoaded, isSignedIn, getToken, signOut: clerkSignOut } = useAuth();
  const [user, setUser] = useState(null);
  const [trackers, setTrackers] = useState([]);
  const [weekEntries, setWeekEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [error, setError] = useState(null);

  const api = useMemo(() => createAPI(() => getToken()), [getToken]);

  const state = (() => {
    if (!isLoaded) return "loading";
    if (!isSignedIn) return "signedOut";
    if (!user) return "loading";
    return user.onboardedAt ? "ready" : "needsOnboarding";
  })();

  const refreshTrackers = useCallback(async () => {
    try { setTrackers(await api.listTrackers()); }
    catch (e) {
      if (e instanceof APIError && e.status === 401) setUser(null);
      else if (e instanceof Error) setError(e.message);
    }
  }, [api]);

  const refreshWeek = useCallback(async () => {
    try {
      const { start, end } = weekRange(selectedDate);
      setWeekEntries(await api.listEntries(start, end));
    } catch (e) {
      if (e instanceof APIError && e.status === 401) setUser(null);
      else if (e instanceof Error) setError(e.message);
    }
  }, [api, selectedDate]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setUser(null);
      setTrackers([]);
      setWeekEntries([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await api.me();
        if (!cancelled) setUser(me.user);
      } catch (e) {
        if (!cancelled && e instanceof Error) setError(e.message);
      }
    })();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, api]);

  useEffect(() => {
    if (state === "ready") {
      refreshTrackers();
      refreshWeek();
    }
  }, [state, refreshTrackers, refreshWeek]);

  useEffect(() => {
    if (state === "ready") refreshWeek();
  }, [selectedDate, state, refreshWeek]);

  const updateProfile = useCallback(async (patch) => {
    const { user: u } = await api.updateMe(patch);
    setUser(u);
  }, [api]);

  const signOut = useCallback(async () => {
    try { await clerkSignOut(); } catch {}
    setUser(null);
  }, [clerkSignOut]);

  const deleteAccount = useCallback(async () => {
    await api.deleteMe();
    try { await clerkSignOut(); } catch {}
    setUser(null);
  }, [api, clerkSignOut]);

  const createTracker = useCallback(async (body) => {
    const t = await api.createTracker(body);
    setTrackers((prev) => [...prev, t].sort(sortTrackers));
    return t;
  }, [api]);

  const updateTracker = useCallback(async (id, body) => {
    const u = await api.updateTracker(id, body);
    setTrackers((prev) => prev.map((t) => (t._id === id ? u : t)).sort(sortTrackers));
  }, [api]);

  const deleteTrackerCb = useCallback(async (id) => {
    await api.deleteTracker(id);
    setTrackers((prev) => prev.filter((t) => t._id !== id));
    setWeekEntries((prev) => prev.filter((e) => e.trackerId !== id));
  }, [api]);

  const createEntry = useCallback(async (body) => {
    const e = await api.createEntry(body);
    await refreshWeek();
    return e;
  }, [api, refreshWeek]);

  const updateEntryCb = useCallback(async (id, body) => {
    await api.updateEntry(id, body);
    await refreshWeek();
  }, [api, refreshWeek]);

  const deleteEntryCb = useCallback(async (id) => {
    await api.deleteEntry(id);
    await refreshWeek();
  }, [api, refreshWeek]);

  const value = useMemo(() => ({
    state, user, trackers, weekEntries, selectedDate, error,
    api,
    setSelectedDate,
    signOut, deleteAccount, updateProfile,
    refreshTrackers, refreshWeek,
    createTracker, updateTracker, deleteTracker: deleteTrackerCb,
    createEntry, updateEntry: updateEntryCb, deleteEntry: deleteEntryCb,
  }), [
    state, user, trackers, weekEntries, selectedDate, error, api,
    signOut, deleteAccount, updateProfile,
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
