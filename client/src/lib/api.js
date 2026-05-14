const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "";
// In dev the Vite proxy forwards /api to localhost:4000 so a relative
// prefix works. In production the React bundle is served from the same
// origin as the API, so relative paths also work.
export const apiBaseURL = RAW_BASE;

export class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function createAPI(getToken) {
  async function request(path, opts = {}) {
    const token = getToken ? await getToken() : null;
    const headers = { Accept: "application/json", ...(opts.headers || {}) };
    if (opts.body) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(apiBaseURL + path, { ...opts, headers });
    if (res.status === 401) throw new APIError("unauthorized", 401);
    if (res.status === 204) return undefined;
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let msg = `HTTP ${res.status}`;
      try { msg = JSON.parse(text).error || msg; } catch {}
      throw new APIError(msg, res.status);
    }
    return res.json();
  }

  return {
    me: () => request("/api/auth/me"),
    updateMe: (body) =>
      request("/api/auth/me", { method: "PUT", body: JSON.stringify(body) }),
    exportMeURL: () => `${apiBaseURL}/api/auth/me/export`,
    deleteMe: () => request("/api/auth/me", { method: "DELETE" }),

    listTrackers: () => request("/api/trackers"),
    createTracker: (body) =>
      request("/api/trackers", { method: "POST", body: JSON.stringify(body) }),
    updateTracker: (id, body) =>
      request(`/api/trackers/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    deleteTracker: (id) =>
      request(`/api/trackers/${id}`, { method: "DELETE" }),
    reorderTrackers: (items) =>
      request("/api/trackers/order", { method: "PUT", body: JSON.stringify({ items }) }),

    listEntries: (start, end) =>
      request(`/api/entries?start=${start}&end=${end}`),
    createEntry: (body) =>
      request("/api/entries", { method: "POST", body: JSON.stringify(body) }),
    updateEntry: (id, body) =>
      request(`/api/entries/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    deleteEntry: (id) =>
      request(`/api/entries/${id}`, { method: "DELETE" }),

    getCoachThread: () => request("/api/coach"),
    sendCoachMessage: (message, date) =>
      request("/api/coach", {
        method: "POST",
        body: JSON.stringify({ message, date }),
      }),
    coachOpener: (date) =>
      request("/api/coach/opener", {
        method: "POST",
        body: JSON.stringify({ date }),
      }),
    resetCoach: () => request("/api/coach", { method: "DELETE" }),
  };
}
