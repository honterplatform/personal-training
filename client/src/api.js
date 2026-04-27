const BASE = "/api";

async function request(path, opts = {}) {
  const res = await fetch(BASE + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (res.status === 401) {
    const err = new Error("unauthorized");
    err.status = 401;
    throw err;
  }
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(text || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const api = {
  login: (password) =>
    request("/auth", { method: "POST", body: JSON.stringify({ password }) }),
  getSettings: () => request("/settings"),
  saveSettings: (body) =>
    request("/settings", { method: "PUT", body: JSON.stringify(body) }),
  getEntries: (start, end) =>
    request(`/entries?start=${start}&end=${end}`),
  saveEntry: (date, activity, body) =>
    request(`/entries/${date}/${activity}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteEntry: (date, activity) =>
    request(`/entries/${date}/${activity}`, { method: "DELETE" }),
  getSummary: (weekStart) => request(`/summary/${weekStart}`),
  generateSummary: (weekStart) =>
    request(`/summary/${weekStart}`, { method: "POST" }),
  getCoachThread: () => request(`/coach`),
  sendCoachMessage: (message, date) =>
    request(`/coach`, { method: "POST", body: JSON.stringify({ message, date }) }),
  coachOpener: (date) =>
    request(`/coach/opener`, { method: "POST", body: JSON.stringify({ date }) }),
  resetCoach: () => request(`/coach`, { method: "DELETE" }),
};
