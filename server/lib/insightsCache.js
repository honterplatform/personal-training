// Per-user insights cache. Keyed by (userId, dayBucket).
// 30-minute TTL. Invalidated explicitly when a user creates/updates a
// weight, nutrition entry, workout entry, or measurement.

const TTL_MS = 30 * 60 * 1000;
const store = new Map();

function key(userId, dayBucket) {
  return `${userId}|${dayBucket}`;
}

export function insightsGet(userId, dayBucket) {
  const hit = store.get(key(userId, dayBucket));
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    store.delete(key(userId, dayBucket));
    return null;
  }
  return hit.result;
}

export function insightsSet(userId, dayBucket, result) {
  store.set(key(userId, dayBucket), { result, expiresAt: Date.now() + TTL_MS });
}

export function insightsInvalidate(userId) {
  const prefix = `${userId}|`;
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (now > v.expiresAt) store.delete(k);
  }
}, 60 * 60 * 1000).unref?.();
