// Helpers to resolve day-type ("training" | "rest") for a given date,
// and to look up the matching macro target from the user object.
//
// A weekday is "rest" if user.weeklySchedule[weekday] is "rest" or null;
// any other value (tkd, squash, strength, strength+tkd, ...) counts as
// a training day.

import { isoToDate } from "./dates.js";

const WEEKDAY_KEY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** "training" | "rest" */
export function dayTypeFor(user, isoDate) {
  if (!isoDate) return "rest";
  const d = isoToDate(isoDate);
  // isoToDate returns a Date in UTC at noon; getUTCDay maps to the
  // intended weekday since we keep dates as YYYY-MM-DD in user TZ.
  const key = WEEKDAY_KEY[d.getUTCDay()];
  const sched = user?.weeklySchedule?.[key];
  return sched && sched !== "rest" ? "training" : "rest";
}

export function dayTypeLabel(t) {
  return t === "training" ? "Training day" : "Rest day";
}

/** Resolved macro target object for the given date, or null if not configured. */
export function targetFor(user, isoDate) {
  const type = dayTypeFor(user, isoDate);
  const target = user?.targets?.[type === "training" ? "trainingDay" : "restDay"];
  if (!target || target.kcal == null) return null;
  return target;
}

/** True when the user has set up training-day targets at all. */
export function hasTargets(user) {
  return user?.targets?.trainingDay?.kcal != null;
}
