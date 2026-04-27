import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, APIError, type AppSettings, type Entry } from "./api";
import { todayISO, weekRange } from "./dates";

type AuthState = "loading" | "authed" | "unauthed";

type StoreCtx = {
  authState: AuthState;
  settings: AppSettings;
  weekEntries: Entry[];
  selectedDate: string;
  error: string | null;
  setSelectedDate: (iso: string) => void;
  login: (password: string) => Promise<void>;
  refreshWeek: () => Promise<void>;
  saveEntry: (date: string, activity: Entry["activity"], patch: Partial<Entry>) => Promise<void>;
  deleteEntry: (date: string, activity: Entry["activity"]) => Promise<void>;
  saveSettings: (s: AppSettings) => Promise<void>;
};

const StoreContext = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [settings, setSettings] = useState<AppSettings>({});
  const [weekEntries, setWeekEntries] = useState<Entry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [error, setError] = useState<string | null>(null);

  const refreshWeek = useCallback(async () => {
    try {
      const { start, end } = weekRange(selectedDate);
      const list = await api.getEntries(start, end);
      setWeekEntries(list);
    } catch (e) {
      if (e instanceof APIError && e.status === 401) {
        setAuthState("unauthed");
      } else if (e instanceof Error) {
        setError(e.message);
      }
    }
  }, [selectedDate]);

  const boot = useCallback(async () => {
    try {
      const s = await api.getSettings();
      setSettings(s);
      const { start, end } = weekRange(selectedDate);
      setWeekEntries(await api.getEntries(start, end));
      setAuthState("authed");
    } catch (e) {
      if (e instanceof APIError && e.status === 401) {
        setAuthState("unauthed");
      } else if (e instanceof Error) {
        setAuthState("unauthed");
        setError(e.message);
      }
    }
  }, [selectedDate]);

  useEffect(() => {
    boot();
  }, []);

  useEffect(() => {
    if (authState === "authed") refreshWeek();
  }, [selectedDate, authState, refreshWeek]);

  const login = useCallback(async (password: string) => {
    await api.login(password);
    await boot();
  }, [boot]);

  const saveEntry = useCallback(
    async (date: string, activity: Entry["activity"], patch: Partial<Entry>) => {
      try {
        await api.saveEntry(date, activity, patch);
        await refreshWeek();
      } catch (e) {
        if (e instanceof APIError && e.status === 401) setAuthState("unauthed");
        else if (e instanceof Error) setError(e.message);
      }
    },
    [refreshWeek]
  );

  const deleteEntry = useCallback(
    async (date: string, activity: Entry["activity"]) => {
      try {
        await api.deleteEntry(date, activity);
        await refreshWeek();
      } catch (e) {
        if (e instanceof APIError && e.status === 401) setAuthState("unauthed");
        else if (e instanceof Error) setError(e.message);
      }
    },
    [refreshWeek]
  );

  const saveSettings = useCallback(async (next: AppSettings) => {
    try {
      const saved = await api.saveSettings(next);
      setSettings(saved);
    } catch (e) {
      if (e instanceof APIError && e.status === 401) setAuthState("unauthed");
      else if (e instanceof Error) setError(e.message);
    }
  }, []);

  const value = useMemo<StoreCtx>(
    () => ({
      authState,
      settings,
      weekEntries,
      selectedDate,
      error,
      setSelectedDate,
      login,
      refreshWeek,
      saveEntry,
      deleteEntry,
      saveSettings,
    }),
    [authState, settings, weekEntries, selectedDate, error, login, refreshWeek, saveEntry, deleteEntry, saveSettings]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreCtx {
  const c = useContext(StoreContext);
  if (!c) throw new Error("useStore outside StoreProvider");
  return c;
}
