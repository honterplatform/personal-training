const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "";
export const apiBaseURL = RAW_BASE;

export class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, opts = {}) {
  const headers = { Accept: "application/json", ...(opts.headers || {}) };
  if (opts.body) headers["Content-Type"] = "application/json";
  const res = await fetch(apiBaseURL + path, {
    credentials: "include",
    ...opts,
    headers,
  });
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

export const api = {
  signup: (body) => request("/api/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  me: () => request("/api/auth/me"),
  updateMe: (body) => request("/api/auth/me", { method: "PUT", body: JSON.stringify(body) }),
  exportMeURL: () => `${apiBaseURL}/api/auth/me/export`,
  deleteMe: () => request("/api/auth/me", { method: "DELETE" }),

  listTrackers: () => request("/api/trackers"),
  createTracker: (body) => request("/api/trackers", { method: "POST", body: JSON.stringify(body) }),
  updateTracker: (id, body) => request(`/api/trackers/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteTracker: (id) => request(`/api/trackers/${id}`, { method: "DELETE" }),
  reorderTrackers: (items) => request("/api/trackers/order", { method: "PUT", body: JSON.stringify({ items }) }),

  listEntries: (start, end) => request(`/api/entries?start=${start}&end=${end}`),
  createEntry: (body) => request("/api/entries", { method: "POST", body: JSON.stringify(body) }),
  updateEntry: (id, body) => request(`/api/entries/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteEntry: (id) => request(`/api/entries/${id}`, { method: "DELETE" }),

  // Weights
  listWeights: (start, end) => request(`/api/weights?start=${start}&end=${end}`),
  logWeight: (body) => request("/api/weights", { method: "POST", body: JSON.stringify(body) }),
  deleteWeight: (id) => request(`/api/weights/${id}`, { method: "DELETE" }),

  // Nutrition
  listNutrition: (start, end) => request(`/api/nutrition?start=${start}&end=${end}`),
  createNutrition: (body) => request("/api/nutrition", { method: "POST", body: JSON.stringify(body) }),
  updateNutrition: (id, body) => request(`/api/nutrition/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteNutrition: (id) => request(`/api/nutrition/${id}`, { method: "DELETE" }),
  estimateMeal: (body) => request("/api/nutrition/estimate", { method: "POST", body: JSON.stringify(body) }),

  // Meal templates
  listTemplates: () => request("/api/templates"),
  createTemplate: (body) => request("/api/templates", { method: "POST", body: JSON.stringify(body) }),
  updateTemplate: (id, body) => request(`/api/templates/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteTemplate: (id) => request(`/api/templates/${id}`, { method: "DELETE" }),
  reorderTemplates: (items) => request("/api/templates/order", { method: "PUT", body: JSON.stringify({ items }) }),

  // Measurements
  listMeasurements: (start, end) => request(`/api/measurements?start=${start}&end=${end}`),
  logMeasurement: (body) => request("/api/measurements", { method: "POST", body: JSON.stringify(body) }),
  updateMeasurement: (id, body) => request(`/api/measurements/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteMeasurement: (id) => request(`/api/measurements/${id}`, { method: "DELETE" }),

  // Photos (multipart upload uses raw fetch — JSON wrapper doesn't suit)
  listPhotos: (start, end) => {
    const qs = start && end ? `?start=${start}&end=${end}` : "";
    return request(`/api/photos${qs}`);
  },
  uploadPhoto: async (file, { date, angle, notes }) => {
    const fd = new FormData();
    fd.append("image", file);
    fd.append("date", date);
    fd.append("angle", angle);
    if (notes) fd.append("notes", notes);
    const res = await fetch(apiBaseURL + "/api/photos", { method: "POST", credentials: "include", body: fd });
    if (res.status === 401) throw new APIError("unauthorized", 401);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let msg = `HTTP ${res.status}`;
      try { msg = JSON.parse(text).error || msg; } catch {}
      throw new APIError(msg, res.status);
    }
    return res.json();
  },
  deletePhoto: (id) => request(`/api/photos/${id}`, { method: "DELETE" }),

  // Insights
  getInsights: (date) => request(`/api/insights${date ? `?date=${date}` : ""}`),

  getCoachThread: () => request("/api/coach"),
  sendCoachMessage: (message, date) => request("/api/coach", { method: "POST", body: JSON.stringify({ message, date }) }),
  coachOpener: (date) => request("/api/coach/opener", { method: "POST", body: JSON.stringify({ date }) }),
  coachReview: (date) => request("/api/coach/review", { method: "POST", body: JSON.stringify({ date }) }),
  resetCoach: () => request("/api/coach", { method: "DELETE" }),
};
