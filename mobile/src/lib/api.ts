import Constants from "expo-constants";

const DEFAULT_BASE_URL = "https://personal-training-production.up.railway.app";

// Override at app build time via app.json `expo.extra.apiBaseUrl`
const fromConfig = (Constants.expoConfig?.extra as any)?.apiBaseUrl;
export const apiBaseURL: string = fromConfig || DEFAULT_BASE_URL;

export class APIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type Demographics = {
  sex?: string | null;
  age?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
  fitnessLevel?: string | null;
};

export type AppUser = {
  _id: string;
  email: string;
  displayName: string;
  demographics: Demographics;
  onboardedAt: string | null;
  timezone: string;
  createdAt: string;
};

export type TrackerKind = "workout" | "intake";

export type Target = {
  period: "daily" | "weekly";
  value: number | null;
  metric: string; // sessions | minutes | km | amount
};

export type Tracker = {
  _id: string;
  userId: string;
  kind: TrackerKind;
  name: string;
  unit: string;
  target: Target;
  pinned: boolean;
  order: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Entry = {
  _id: string;
  userId: string;
  trackerId: string;
  date: string;
  durationMin?: number | null;
  distanceKm?: number | null;
  rpe?: number | null;
  amount?: number | null;
  notes?: string;
  caloriesBurned?: number | null;
  caloriesBurnedSource?: "ai" | "fallback" | "manual" | null;
  done?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(apiBaseURL + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    ...init,
  });
  if (res.status === 401) throw new APIError("unauthorized", 401);
  if (res.status === 204) return undefined as unknown as T;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let msg = `HTTP ${res.status}`;
    try { msg = JSON.parse(text).error || msg; } catch {}
    throw new APIError(msg, res.status);
  }
  return (await res.json()) as T;
}

export const api = {
  // Auth
  signup: (body: { email: string; password: string; displayName?: string }) =>
    request<{ user: AppUser }>("/api/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<{ user: AppUser }>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  appleSignIn: (body: { identityToken: string; fullName?: string }) =>
    request<{ user: AppUser }>("/api/auth/apple", { method: "POST", body: JSON.stringify(body) }),
  googleSignIn: (idToken: string) =>
    request<{ user: AppUser }>("/api/auth/google", { method: "POST", body: JSON.stringify({ idToken }) }),
  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),
  me: () => request<{ user: AppUser }>("/api/auth/me"),
  updateMe: (body: { displayName?: string; demographics?: Demographics; onboardedAt?: boolean }) =>
    request<{ user: AppUser }>("/api/auth/me", { method: "PUT", body: JSON.stringify(body) }),
  exportMe: () => `${apiBaseURL}/api/auth/me/export`, // open in browser / download
  deleteMe: () => request<{ ok: true }>("/api/auth/me", { method: "DELETE" }),

  // Trackers
  listTrackers: () => request<Tracker[]>("/api/trackers"),
  createTracker: (body: { kind: TrackerKind; name: string; unit?: string; target?: Partial<Target>; pinned?: boolean }) =>
    request<Tracker>("/api/trackers", { method: "POST", body: JSON.stringify(body) }),
  updateTracker: (id: string, body: Partial<Tracker>) =>
    request<Tracker>(`/api/trackers/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteTracker: (id: string) =>
    request<{ ok: true }>(`/api/trackers/${id}`, { method: "DELETE" }),
  reorderTrackers: (items: { id: string; pinned?: boolean }[]) =>
    request<{ ok: true }>("/api/trackers/order", { method: "PUT", body: JSON.stringify({ items }) }),

  // Entries
  listEntries: (start: string, end: string) =>
    request<Entry[]>(`/api/entries?start=${start}&end=${end}`),
  createEntry: (body: {
    trackerId: string;
    date: string;
    durationMin?: number | null;
    distanceKm?: number | null;
    rpe?: number | null;
    amount?: number | null;
    notes?: string;
  }) => request<Entry>("/api/entries", { method: "POST", body: JSON.stringify(body) }),
  updateEntry: (id: string, body: Partial<Entry>) =>
    request<Entry>(`/api/entries/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteEntry: (id: string) =>
    request<{ ok: true }>(`/api/entries/${id}`, { method: "DELETE" }),

  // Coach
  getCoachThread: () => request<{ messages: ChatMessage[] }>("/api/coach"),
  sendCoachMessage: (message: string, date?: string | null) =>
    request<{ messages: ChatMessage[] }>("/api/coach", {
      method: "POST",
      body: JSON.stringify({ message, date }),
    }),
  coachOpener: (date?: string | null) =>
    request<{ messages: ChatMessage[] }>("/api/coach/opener", {
      method: "POST",
      body: JSON.stringify({ date }),
    }),
  resetCoach: () => request<{ messages: ChatMessage[] }>("/api/coach", { method: "DELETE" }),
};
