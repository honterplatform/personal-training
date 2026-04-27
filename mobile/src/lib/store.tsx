import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@clerk/clerk-expo";
import {
  APIClient,
  APIError,
  type AppUser,
  type Tracker,
  type Entry,
} from "./api";
import { todayISO, weekRange } from "./dates";

type AppState = "loading" | "signedOut" | "needsOnboarding" | "ready";

type StoreCtx = {
  state: AppState;
  user: AppUser | null;
  trackers: Tracker[];
  weekEntries: Entry[];
  selectedDate: string;
  error: string | null;

  api: APIClient;

  setSelectedDate: (iso: string) => void;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateProfile: (patch: { displayName?: string; demographics?: AppUser["demographics"]; onboardedAt?: boolean }) => Promise<void>;
  refreshTrackers: () => Promise<void>;
  refreshWeek: () => Promise<void>;

  createTracker: (body: Parameters<APIClient["createTracker"]>[0]) => Promise<Tracker>;
  updateTracker: (id: string, body: Partial<Tracker>) => Promise<void>;
  deleteTracker: (id: string) => Promise<void>;
  createEntry: (body: Parameters<APIClient["createEntry"]>[0]) => Promise<Entry>;
  updateEntry: (id: string, body: Partial<Entry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
};

const StoreContext = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken, signOut: clerkSignOut } = useAuth();
  const [user, setUser] = useState<AppUser | null>(null);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [weekEntries, setWeekEntries] = useState<Entry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [error, setError] = useState<string | null>(null);
  const [bootedOnce, setBootedOnce] = useState(false);

  const api = useMemo(
    () => new APIClient(() => getToken()),
    [getToken]
  );

  const state: AppState = useMemo(() => {
    if (!isLoaded) return "loading";
    if (!isSignedIn) return "signedOut";
    if (!user) return "loading";
    return user.onboardedAt ? "ready" : "needsOnboarding";
  }, [isLoaded, isSignedIn, user]);

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

  // When Clerk says we're signed in, fetch our user row + initial data
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setUser(null);
      setTrackers([]);
      setWeekEntries([]);
      setBootedOnce(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await api.me();
        if (!cancelled) setUser(me.user);
      } catch (e) {
        if (!cancelled && e instanceof Error) setError(e.message);
      } finally {
        if (!cancelled) setBootedOnce(true);
      }
    })();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, api]);

  // Once user is loaded and onboarded, fetch trackers + this week's entries
  useEffect(() => {
    if (state === "ready") {
      refreshTrackers();
      refreshWeek();
    }
  }, [state, refreshTrackers, refreshWeek]);

  // Re-fetch entries on date changes
  useEffect(() => {
    if (state === "ready") refreshWeek();
  }, [selectedDate, state, refreshWeek]);

  const updateProfile = useCallback(async (patch: { displayName?: string; demographics?: AppUser["demographics"]; onboardedAt?: boolean }) => {
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

  const createTracker = useCallback(async (body: Parameters<APIClient["createTracker"]>[0]) => {
    const t = await api.createTracker(body);
    setTrackers((prev) => [...prev, t].sort(sortTrackers));
    return t;
  }, [api]);

  const updateTracker = useCallback(async (id: string, body: Partial<Tracker>) => {
    const updated = await api.updateTracker(id, body);
    setTrackers((prev) => prev.map((t) => (t._id === id ? updated : t)).sort(sortTrackers));
  }, [api]);

  const deleteTrackerCb = useCallback(async (id: string) => {
    await api.deleteTracker(id);
    setTrackers((prev) => prev.filter((t) => t._id !== id));
    setWeekEntries((prev) => prev.filter((e) => e.trackerId !== id));
  }, [api]);

  const createEntry = useCallback(async (body: Parameters<APIClient["createEntry"]>[0]) => {
    const e = await api.createEntry(body);
    await refreshWeek();
    return e;
  }, [api, refreshWeek]);

  const updateEntryCb = useCallback(async (id: string, body: Partial<Entry>) => {
    await api.updateEntry(id, body);
    await refreshWeek();
  }, [api, refreshWeek]);

  const deleteEntryCb = useCallback(async (id: string) => {
    await api.deleteEntry(id);
    await refreshWeek();
  }, [api, refreshWeek]);

  const value = useMemo<StoreCtx>(() => ({
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

  void bootedOnce;
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function sortTrackers(a: Tracker, b: Tracker) {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  return a.order - b.order;
}

export function useStore(): StoreCtx {
  const c = useContext(StoreContext);
  if (!c) throw new Error("useStore outside StoreProvider");
  return c;
}
