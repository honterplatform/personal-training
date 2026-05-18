// Per-user daily AI call quota. Counters live on the User document
// under `aiCalls = { date, estimate, coach }`, reset when date rolls
// over (America/Bogota, via dates.todayISO()).
//
// Cache hits skip the counter — only real AI calls cost money.

import User from "../models/User.js";
import { todayISO } from "../dates.js";

const CAPS = {
  estimate: 100,
  coach:    50,
};

const TYPE_LABEL = {
  estimate: "estimate",
  coach:    "coach",
};

/**
 * Throws { http: 429, body: {...} } if the user is over their cap.
 * Otherwise increments the counter and persists. Call BEFORE the AI request,
 * but only after a cache miss — cache hits should skip this entirely.
 */
export async function consumeQuota(userId, type) {
  const cap = CAPS[type];
  if (cap == null) throw new Error(`unknown ai quota type: ${type}`);

  const user = await User.findById(userId);
  if (!user) throw new Error("user not found");

  const today = todayISO();
  if (user.aiCalls?.date !== today) {
    user.aiCalls = { date: today, estimate: 0, coach: 0 };
  }

  if ((user.aiCalls[type] ?? 0) >= cap) {
    const err = new Error("ai quota exceeded");
    err.http = 429;
    err.body = {
      error: "AI limit reached today — log manually or try tomorrow",
      resetsAt: nextDayBoundary(today),
      type,
      limit: cap,
    };
    throw err;
  }

  user.aiCalls[type] = (user.aiCalls[type] ?? 0) + 1;
  await user.save();

  const count = user.aiCalls[type];
  console.log(`[ai] user=${user._id} type=${TYPE_LABEL[type]} count=${count}/${cap}`);

  return { count, cap };
}

function nextDayBoundary(todayIso) {
  // Bogotá midnight; we just bump the date string. Client can format from this.
  const [y, m, d] = todayIso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  return dt.toISOString().slice(0, 10);
}

/** Express helper — converts a quota error into a 429 response. */
export function sendQuotaErrorIfAny(err, res) {
  if (err?.http === 429 && err?.body) {
    res.status(429).json(err.body);
    return true;
  }
  return false;
}

export { CAPS };
