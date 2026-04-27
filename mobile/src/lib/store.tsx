import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  APIError,
  type AppUser,
  type Tracker,
  type Entry,
} from "./api";
import { todayISO, weekRange } from "./dates";

type AuthState = "loading" | "signedOut" | "needsOnboarding" | "ready";

type StoreCtx = {
  authState: AuthState;
  user: AppUser | null;
  trackers: Tracker[];
  weekEntries: Entry[];
  selectedDate: string;
  error: string | null;

  setSelectedDate: (iso: string) => void;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signInWithApple: (identityToken: string, fullName?: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateProfile: (patch: { displayName?: string; demographics?: AppUser["demographics"]; onboardedAt?: boolean }) => Promise<void>;
  refreshTrackers: () => Promise<void>;
  refreshWeek: () => Promise<void>;
  createTracker: (body: Parameters<typeof api.createTracker>[0]) => Promise<Tracker>;
  updateTracker: (id: string, body: Partial<Tracker>) => Promise<void>;
  deleteTracker: (id: string) => Promise<void>;
  createEntry: (body: Parameters<typeof api.createEntry>[0]) => Promise<Entry>;
  updateEntry: (id: string, body: Partial<Entry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
};

const StoreContext = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [user, setUser] = useState<AppUser | null>(null);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [weekEntries, setWeekEntries] = useState<Entry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [error, setError] = useState<string | null>(null);

  const settle = useCallback((u: AppUser | null) => {
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

  const refreshTrackers = useCallback(async () => {
    try {
      const list = await api.listTrackers();
      setTrackers(list);
    } catch (e) {
      if (e instanceof APIError && e.status === 401) settle(null);
      else if (e instanceof Error) setError(e.message);
    }
  }, [settle]);

  const refreshWeek = useCallback(async () => {
    try {
      const { start, end } = weekRange(selectedDate);
      const list = await api.listEntries(start, end);
      setWeekEntries(list);
    } catch (e) {
      if (e instanceof APIError && e.status === 401) settle(null);
      else if (e instanceof Error) setError(e.message);
    }
  }, [selectedDate, settle]);

  const boot = useCallback(async () => {
    try {
      const me = await api.me();
      settle(me.user);
    } catch (e) {
      if (e instanceof APIError && e.status === 401) settle(null);
      else { settle(null); if (e instanceof Error) setError(e.message); }
    }
  }, [settle]);

  useEffect(() => {
    boot();
  }, []);

  useEffect(() => {
    if (authState === "ready") {
      refreshTrackers();
      refreshWeek();
    }
  }, [authState, refreshTrackers, refreshWeek]);

  useEffect(() => {
    if (authState === "ready") refreshWeek();
  }, [selectedDate, authState, refreshWeek]);

  const signup = useCallback(async (email: string, password: string, displayName?: string) => {
    const { user } = await api.signup({ email, password, displayName });
    settle(user);
  }, [settle]);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await api.login({ email, password });
    settle(user);
  }, [settle]);

  const signInWithApple = useCallback(async (identityToken: string, fullName?: string) => {
    const { user } = await api.appleSignIn({ identityToken, fullName });
    settle(user);
  }, [settle]);

  const signInWithGoogle = useCallback(async (idToken: string) => {
    const { user } = await api.googleSignIn(idToken);
    settle(user);
  }, [settle]);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch {}
    settle(null);
  }, [settle]);

  const deleteAccount = useCallback(async () => {
    await api.deleteMe();
    settle(null);
  }, [settle]);

  const updateProfile = useCallback(async (patch: { displayName?: string; demographics?: AppUser["demographics"]; onboardedAt?: boolean }) => {
    const { user } = await api.updateMe(patch);
    settle(user);
  }, [settle]);

  const createTracker = useCallback(async (body: Parameters<typeof api.createTracker>[0]) => {
    const t = await api.createTracker(body);
    setTrackers((prev) => [...prev, t].sort(sortTrackers));
    return t;
  }, []);

  const updateTracker = useCallback(async (id: string, body: Partial<Tracker>) => {
    const updated = await api.updateTracker(id, body);
    setTrackers((prev) => prev.map((t) => (t._id === id ? updated : t)).sort(sortTrackers));
  }, []);

  const deleteTrackerCb = useCallback(async (id: string) => {
    await api.deleteTracker(id);
    setTrackers((prev) => prev.filter((t) => t._id !== id));
    setWeekEntries((prev) => prev.filter((e) => e.trackerId !== id));
  }, []);

  const createEntry = useCallback(async (body: Parameters<typeof api.createEntry>[0]) => {
    const e = await api.createEntry(body);
    await refreshWeek();
    return e;
  }, [refreshWeek]);

  const updateEntryCb = useCallback(async (id: string, body: Partial<Entry>) => {
    await api.updateEntry(id, body);
    await refreshWeek();
  }, [refreshWeek]);

  const deleteEntryCb = useCallback(async (id: string) => {
    await api.deleteEntry(id);
    await refreshWeek();
  }, [refreshWeek]);

  const value = useMemo<StoreCtx>(
    () => ({
      authState, user, trackers, weekEntries, selectedDate, error,
      setSelectedDate,
      signup, login, signInWithApple, signInWithGoogle, logout, deleteAccount, updateProfile,
      refreshTrackers, refreshWeek,
      createTracker, updateTracker, deleteTracker: deleteTrackerCb,
      createEntry, updateEntry: updateEntryCb, deleteEntry: deleteEntryCb,
    }),
    [
      authState, user, trackers, weekEntries, selectedDate, error,
      signup, login, signInWithApple, signInWithGoogle, logout, deleteAccount, updateProfile,
      refreshTrackers, refreshWeek,
      createTracker, updateTracker, deleteTrackerCb,
      createEntry, updateEntryCb, deleteEntryCb,
    ]
  );

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
