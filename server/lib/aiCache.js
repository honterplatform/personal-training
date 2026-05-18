// In-memory cache for AI estimate results.
// Keyed by sha1(normalize(text) + "|" + mealSlot).
// Survives across requests, lost on restart. Suitable for Phase 2.

import crypto from "crypto";

const TTL_MS = 30 * 24 * 60 * 60 * 1000;  // 30 days
const PRUNE_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

const store = new Map();

function normalize(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function makeKey({ text, mealSlot }) {
  const payload = `${normalize(text)}|${mealSlot || ""}`;
  return crypto.createHash("sha1").update(payload).digest("hex");
}

export function cacheGet(args) {
  const key = makeKey(args);
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return null;
  }
  return hit.result;
}

export function cacheSet(args, result) {
  store.set(makeKey(args), { result, expiresAt: Date.now() + TTL_MS });
}

export function cacheClear() {
  const n = store.size;
  store.clear();
  return n;
}

export function cacheSize() {
  return store.size;
}

// Periodic prune to keep memory bounded under heavy use.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (now > v.expiresAt) store.delete(k);
  }
}, PRUNE_INTERVAL_MS).unref?.();
