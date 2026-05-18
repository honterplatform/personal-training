import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, APIError } from "./api.js";
import { todayISO, weekRange, isoToDate } from "./dates.js";

const StoreContext = createContext(null);

function sortTrackers(a, b) {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  return a.order - b.order;
}

// Trailing window of N days ending at the selected date.
function trailingWindow(iso, days) {
  const end = isoToDate(iso);
  const start = new Date(end.getTime() - (days - 1) * 86_400_000);
  const fmt = (d) => {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };
  return { start: fmt(start), end: fmt(end) };
}

export function StoreProvider({ children }) {
  const [authState, setAuthState] = useState("loading");
  const [user, setUser] = useState(null);
  const [trackers, setTrackers] = useState([]);
  const [weekEntries, setWeekEntries] = useState([]);
  const [nutrition, setNutrition] = useState([]);    // current week's meals
  const [weights, setWeights] = useState([]);        // last 30 days
  const [templates, setTemplates] = useState([]);    // all of the user's meal templates
  const [measurements, setMeasurements] = useState([]); // trailing 90 days
  const [photos, setPhotos] = useState([]);          // trailing 90 days
  const [insights, setInsights] = useState({ current: [], patterns: [], warnings: [] });
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [error, setError] = useState(null);

  const settle = useCallback((u) => {
    if (!u) {
      setUser(null);
      setTrackers([]);
      setWeekEntries([]);
      setNutrition([]);
      setWeights([]);
      setTemplates([]);
      setMeasurements([]);
      setPhotos([]);
      setInsights({ current: [], patterns: [], warnings: [] });
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
      const [entries, meals] = await Promise.all([
        api.listEntries(start, end),
        api.listNutrition(start, end),
      ]);
      setWeekEntries(entries);
      setNutrition(meals);
    } catch (e) {
      if (e instanceof APIError && e.status === 401) settle(null);
      else if (e instanceof Error) setError(e.message);
    }
  }, [selectedDate, settle]);

  const refreshWeights = useCallback(async () => {
    try {
      const { start, end } = trailingWindow(selectedDate, 30);
      setWeights(await api.listWeights(start, end));
    } catch (e) {
      if (e instanceof APIError && e.status === 401) settle(null);
      else if (e instanceof Error) setError(e.message);
    }
  }, [selectedDate, settle]);

  const refreshTemplates = useCallback(async () => {
    try { setTemplates(await api.listTemplates()); }
    catch (e) {
      if (e instanceof APIError && e.status === 401) settle(null);
      else if (e instanceof Error) setError(e.message);
    }
  }, [settle]);

  const refreshMeasurements = useCallback(async () => {
    try {
      const { start, end } = trailingWindow(selectedDate, 90);
      setMeasurements(await api.listMeasurements(start, end));
    } catch (e) {
      if (e instanceof APIError && e.status === 401) settle(null);
      else if (e instanceof Error) setError(e.message);
    }
  }, [selectedDate, settle]);

  const refreshPhotos = useCallback(async () => {
    try {
      const { start, end } = trailingWindow(selectedDate, 90);
      setPhotos(await api.listPhotos(start, end));
    } catch (e) {
      if (e instanceof APIError && e.status === 401) settle(null);
      else if (e instanceof Error) setError(e.message);
    }
  }, [selectedDate, settle]);

  const refreshInsights = useCallback(async () => {
    try { setInsights(await api.getInsights(selectedDate)); }
    catch (e) {
      if (e instanceof APIError && e.status === 401) settle(null);
      // insights failure is non-fatal — keep last known
    }
  }, [selectedDate, settle]);

  useEffect(() => { boot(); }, [boot]);

  useEffect(() => {
    if (authState === "ready") {
      refreshTrackers();
      refreshWeek();
      refreshWeights();
      refreshTemplates();
      refreshMeasurements();
      refreshPhotos();
      refreshInsights();
    }
  }, [authState, refreshTrackers, refreshWeek, refreshWeights, refreshTemplates,
      refreshMeasurements, refreshPhotos, refreshInsights]);

  useEffect(() => {
    if (authState === "ready") {
      refreshWeek();
      refreshWeights();
      refreshMeasurements();
      refreshInsights();
    }
  }, [selectedDate, authState, refreshWeek, refreshWeights, refreshMeasurements, refreshInsights]);

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

  // Trackers
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

  // Entries (workouts + non-macro intakes)
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

  // Weights
  const logWeight = useCallback(async (body) => {
    await api.logWeight(body);
    await refreshWeights();
  }, [refreshWeights]);

  const deleteWeight = useCallback(async (id) => {
    await api.deleteWeight(id);
    await refreshWeights();
  }, [refreshWeights]);

  // Nutrition
  const createNutrition = useCallback(async (body) => {
    const e = await api.createNutrition(body);
    await refreshWeek();
    return e;
  }, [refreshWeek]);

  const updateNutrition = useCallback(async (id, body) => {
    await api.updateNutrition(id, body);
    await refreshWeek();
  }, [refreshWeek]);

  const deleteNutrition = useCallback(async (id) => {
    await api.deleteNutrition(id);
    await refreshWeek();
  }, [refreshWeek]);

  // Templates
  const createTemplate = useCallback(async (body) => {
    const t = await api.createTemplate(body);
    await refreshTemplates();
    return t;
  }, [refreshTemplates]);

  const updateTemplate = useCallback(async (id, body) => {
    await api.updateTemplate(id, body);
    await refreshTemplates();
  }, [refreshTemplates]);

  const deleteTemplateCb = useCallback(async (id) => {
    await api.deleteTemplate(id);
    await refreshTemplates();
  }, [refreshTemplates]);

  // Measurements
  const logMeasurement = useCallback(async (body) => {
    await api.logMeasurement(body);
    await Promise.all([refreshMeasurements(), refreshInsights()]);
  }, [refreshMeasurements, refreshInsights]);

  const deleteMeasurement = useCallback(async (id) => {
    await api.deleteMeasurement(id);
    await Promise.all([refreshMeasurements(), refreshInsights()]);
  }, [refreshMeasurements, refreshInsights]);

  // Photos
  const uploadPhoto = useCallback(async (file, meta) => {
    const p = await api.uploadPhoto(file, meta);
    await refreshPhotos();
    return p;
  }, [refreshPhotos]);

  const deletePhotoCb = useCallback(async (id) => {
    await api.deletePhoto(id);
    await refreshPhotos();
  }, [refreshPhotos]);

  const value = useMemo(() => ({
    state: authState, user, trackers, weekEntries, nutrition, weights, templates,
    measurements, photos, insights,
    selectedDate, error,
    setSelectedDate,
    signup, login, signOut, deleteAccount, updateProfile,
    refreshTrackers, refreshWeek, refreshWeights, refreshTemplates,
    refreshMeasurements, refreshPhotos, refreshInsights,
    createTracker, updateTracker, deleteTracker: deleteTrackerCb,
    createEntry, updateEntry: updateEntryCb, deleteEntry: deleteEntryCb,
    logWeight, deleteWeight,
    createNutrition, updateNutrition, deleteNutrition,
    createTemplate, updateTemplate, deleteTemplate: deleteTemplateCb,
    logMeasurement, deleteMeasurement,
    uploadPhoto, deletePhoto: deletePhotoCb,
  }), [
    authState, user, trackers, weekEntries, nutrition, weights, templates,
    measurements, photos, insights,
    selectedDate, error,
    signup, login, signOut, deleteAccount, updateProfile,
    refreshTrackers, refreshWeek, refreshWeights, refreshTemplates,
    refreshMeasurements, refreshPhotos, refreshInsights,
    createTracker, updateTracker, deleteTrackerCb,
    createEntry, updateEntryCb, deleteEntryCb,
    logWeight, deleteWeight,
    createNutrition, updateNutrition, deleteNutrition,
    createTemplate, updateTemplate, deleteTemplateCb,
    logMeasurement, deleteMeasurement,
    uploadPhoto, deletePhotoCb,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const c = useContext(StoreContext);
  if (!c) throw new Error("useStore outside StoreProvider");
  return c;
}
