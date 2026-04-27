import Constants from "expo-constants";

const DEFAULT_BASE_URL = "https://personal-training-production.up.railway.app";
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
  metric: string;
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

export type GetToken = () => Promise<string | null>;

export class APIClient {
  constructor(private getToken: GetToken) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.getToken();
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (init.body) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(apiBaseURL + path, { ...init, headers });
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

  // User
  me() { return this.request<{ user: AppUser }>("/api/auth/me"); }
  updateMe(body: { displayName?: string; demographics?: Demographics; onboardedAt?: boolean }) {
    return this.request<{ user: AppUser }>("/api/auth/me", {
      method: "PUT", body: JSON.stringify(body),
    });
  }
  exportMeURL() { return `${apiBaseURL}/api/auth/me/export`; }
  deleteMe() { return this.request<{ ok: true }>("/api/auth/me", { method: "DELETE" }); }

  // Trackers
  listTrackers() { return this.request<Tracker[]>("/api/trackers"); }
  createTracker(body: { kind: TrackerKind; name: string; unit?: string; target?: Partial<Target>; pinned?: boolean }) {
    return this.request<Tracker>("/api/trackers", { method: "POST", body: JSON.stringify(body) });
  }
  updateTracker(id: string, body: Partial<Tracker>) {
    return this.request<Tracker>(`/api/trackers/${id}`, { method: "PUT", body: JSON.stringify(body) });
  }
  deleteTracker(id: string) {
    return this.request<{ ok: true }>(`/api/trackers/${id}`, { method: "DELETE" });
  }
  reorderTrackers(items: { id: string; pinned?: boolean }[]) {
    return this.request<{ ok: true }>("/api/trackers/order", {
      method: "PUT", body: JSON.stringify({ items }),
    });
  }

  // Entries
  listEntries(start: string, end: string) {
    return this.request<Entry[]>(`/api/entries?start=${start}&end=${end}`);
  }
  createEntry(body: {
    trackerId: string;
    date: string;
    durationMin?: number | null;
    distanceKm?: number | null;
    rpe?: number | null;
    amount?: number | null;
    notes?: string;
  }) {
    return this.request<Entry>("/api/entries", { method: "POST", body: JSON.stringify(body) });
  }
  updateEntry(id: string, body: Partial<Entry>) {
    return this.request<Entry>(`/api/entries/${id}`, { method: "PUT", body: JSON.stringify(body) });
  }
  deleteEntry(id: string) {
    return this.request<{ ok: true }>(`/api/entries/${id}`, { method: "DELETE" });
  }

  // Coach
  getCoachThread() { return this.request<{ messages: ChatMessage[] }>("/api/coach"); }
  sendCoachMessage(message: string, date?: string | null) {
    return this.request<{ messages: ChatMessage[] }>("/api/coach", {
      method: "POST", body: JSON.stringify({ message, date }),
    });
  }
  coachOpener(date?: string | null) {
    return this.request<{ messages: ChatMessage[] }>("/api/coach/opener", {
      method: "POST", body: JSON.stringify({ date }),
    });
  }
  resetCoach() { return this.request<{ messages: ChatMessage[] }>("/api/coach", { method: "DELETE" }); }
}
