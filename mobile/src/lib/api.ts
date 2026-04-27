const BASE_URL = "https://personal-training-production.up.railway.app";

export class APIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type AppSettings = {
  bodyWeightKg?: number | null;
  proteinGoalG?: number | null;
  sex?: string | null;
  age?: number | null;
  fitnessLevel?: string | null;
};

export type Entry = {
  _id?: string;
  date: string;
  activity: "walk" | "squash" | "taekwondo" | "strength" | "protein";
  done: boolean;
  distanceKm?: number | null;
  durationMin?: number | null;
  rpe?: number | null;
  proteinG?: number | null;
  notes?: string;
  caloriesBurned?: number | null;
  updatedAt?: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(BASE_URL + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    ...init,
  });
  if (res.status === 401) throw new APIError("unauthorized", 401);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new APIError(text || `HTTP ${res.status}`, res.status);
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

export const api = {
  login: (password: string) =>
    request<{ ok: true }>("/api/auth", { method: "POST", body: JSON.stringify({ password }) }),
  getSettings: () => request<AppSettings>("/api/settings"),
  saveSettings: (s: AppSettings) =>
    request<AppSettings>("/api/settings", { method: "PUT", body: JSON.stringify(s) }),
  getEntries: (start: string, end: string) =>
    request<Entry[]>(`/api/entries?start=${start}&end=${end}`),
  saveEntry: (date: string, activity: Entry["activity"], patch: Partial<Entry>) =>
    request<Entry>(`/api/entries/${date}/${activity}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    }),
  deleteEntry: (date: string, activity: Entry["activity"]) =>
    request<{ ok: true }>(`/api/entries/${date}/${activity}`, { method: "DELETE" }),
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

export const apiBaseURL = BASE_URL;
