// Pure functions over a user's logged data → array of Insights.
// Each insight has an id, category ("current" | "patterns" | "warnings"),
// short text, severity, and meta for the UI.

import User from "../models/User.js";
import NutritionEntry from "../models/NutritionEntry.js";
import Entry from "../models/Entry.js";
import Tracker from "../models/Tracker.js";
import { todayISO, isoToDate, weekStartISO, weekRange } from "../dates.js";

const DAY_MS = 86_400_000;

const WEEKDAY_KEY = ["sun","mon","tue","wed","thu","fri","sat"];
function weekdayOf(iso) {
  return WEEKDAY_KEY[isoToDate(iso).getUTCDay()];
}

export async function computeInsights(userId, refDate = todayISO()) {
  const user = await User.findById(userId).lean();
  if (!user) return { current: [], patterns: [], warnings: [] };

  const target = user?.targets || {};

  const trail = (days) => {
    const end = isoToDate(refDate);
    const start = new Date(end.getTime() - (days - 1) * DAY_MS);
    return { start: fmtISO(start), end: fmtISO(end) };
  };

  const n28 = trail(28);
  const e28 = trail(28);

  const [nutrition, entries, trackers] = await Promise.all([
    NutritionEntry.find({ userId, date: { $gte: n28.start, $lte: n28.end } }).sort({ date: 1 }).lean(),
    Entry.find({ userId, date: { $gte: e28.start, $lte: e28.end } }).sort({ date: 1 }).lean(),
    Tracker.find({ userId, archivedAt: null }).lean(),
  ]);

  const insights = [];

  // ===== CURRENT =====
  // Weekly burn this week
  {
    const ws = weekStartISO(refDate);
    const wr = weekRange(refDate);
    const wkEntries = entries.filter((e) => e.date >= wr.start && e.date <= wr.end);
    const burn = wkEntries.reduce((s, e) => s + (e.caloriesBurned || 0), 0);
    if (wkEntries.length > 0) {
      insights.push({
        id: "weekly-burn",
        category: "current",
        text: `${burn.toLocaleString()} kcal burned this week`,
        severity: "neutral",
        meta: { burn, weekStart: ws },
      });
    }
  }

  // Protein adherence over last 28 days
  {
    const days = bucketByDate(nutrition);
    const dayKeys = Object.keys(days);
    if (dayKeys.length >= 7 && target.proteinG) {
      let hit = 0;
      for (const dayKey of dayKeys) {
        const proteinSum = days[dayKey].reduce((s, m) => s + (m.proteinG || 0), 0);
        if (proteinSum >= target.proteinG) hit += 1;
      }
      insights.push({
        id: "protein-adherence",
        category: "current",
        text: `Hit protein ${hit}/${dayKeys.length} days this month`,
        severity: hit >= dayKeys.length * 0.85 ? "positive" : hit < dayKeys.length * 0.5 ? "warning" : "neutral",
        meta: { hit, days: dayKeys.length },
      });
    }
  }

  // Training streak (any workout entry on consecutive days)
  {
    const trackerSet = new Set(trackers.filter((t) => t.kind === "workout").map((t) => String(t._id)));
    let streak = 0;
    let cur = isoToDate(refDate);
    while (true) {
      const day = fmtISO(cur);
      const did = entries.some((e) => e.date === day && trackerSet.has(String(e.trackerId)));
      if (!did) break;
      streak += 1;
      cur = new Date(cur.getTime() - DAY_MS);
    }
    if (streak >= 3) {
      insights.push({
        id: "training-streak",
        category: "current",
        text: `${streak}-day training streak`,
        severity: "positive",
        meta: { streak },
      });
    }
  }

  // ===== PATTERNS =====
  // Weekend vs weekday kcal skew
  {
    const days = bucketByDate(nutrition);
    let weekendDays = [], weekdayDays = [];
    for (const [day, items] of Object.entries(days)) {
      const wd = weekdayOf(day);
      const sum = items.reduce((s, m) => s + (m.calories || 0), 0);
      if (wd === "sat" || wd === "sun") weekendDays.push(sum);
      else weekdayDays.push(sum);
    }
    if (weekendDays.length >= 3 && weekdayDays.length >= 3) {
      const wkE = avg(weekendDays);
      const wd  = avg(weekdayDays);
      const delta = wkE - wd;
      if (Math.abs(delta) >= 150) {
        insights.push({
          id: "weekend-kcal-skew",
          category: "patterns",
          text: `Weekend kcal avg ${Math.abs(Math.round(delta))} ${delta > 0 ? "above" : "below"} weekday avg`,
          severity: delta > 300 ? "warning" : "neutral",
          meta: { weekendAvg: wkE, weekdayAvg: wd, delta },
        });
      }
    }
  }

  // ===== WARNINGS =====
  // Yesterday low protein
  {
    const y = fmtISO(new Date(isoToDate(refDate).getTime() - DAY_MS));
    const yMeals = nutrition.filter((m) => m.date === y);
    if (yMeals.length > 0 && target.proteinG) {
      const sum = yMeals.reduce((s, m) => s + (m.proteinG || 0), 0);
      if (sum < target.proteinG * 0.8) {
        insights.push({
          id: "low-protein-day",
          category: "warnings",
          text: `Yesterday: ${Math.round(sum)}g protein (target ${target.proteinG}g)`,
          severity: "warning",
          meta: { actual: sum, target: target.proteinG },
        });
      }
    }
  }

  // Kcal daily variance
  {
    const days = bucketByDate(nutrition);
    const dailyKcal = Object.values(days).map((items) => items.reduce((s, m) => s + (m.calories || 0), 0));
    if (dailyKcal.length >= 14) {
      const sd = stddev(dailyKcal);
      if (sd > 350) {
        insights.push({
          id: "kcal-variance",
          category: "warnings",
          text: `Daily kcal varies by ±${Math.round(sd)} — try to stabilize`,
          severity: "warning",
          meta: { stddev: sd, samples: dailyKcal.length },
        });
      }
    }
  }

  return {
    current:  insights.filter((i) => i.category === "current"),
    patterns: insights.filter((i) => i.category === "patterns"),
    warnings: insights.filter((i) => i.category === "warnings"),
  };
}

/* ---------- helpers ---------- */
function bucketByDate(items) {
  const o = {};
  for (const it of items) (o[it.date] ||= []).push(it);
  return o;
}
function avg(arr) { return arr.reduce((s, n) => s + n, 0) / arr.length; }
function stddev(arr) {
  const a = avg(arr);
  return Math.sqrt(arr.reduce((s, n) => s + (n - a) ** 2, 0) / arr.length);
}
function fmtISO(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
}
