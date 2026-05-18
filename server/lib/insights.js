// Pure functions over a user's logged data → array of Insights.
// Each insight has an id, category ("current" | "patterns" | "warnings"),
// short text, severity, and meta for the UI.
//
// Every insight has an explicit minimum data threshold. None fires until
// its threshold is met — prevents noise on a fresh account.

import User from "../models/User.js";
import Weight from "../models/Weight.js";
import NutritionEntry from "../models/NutritionEntry.js";
import Entry from "../models/Entry.js";
import Tracker from "../models/Tracker.js";
import Measurement from "../models/Measurement.js";
import { todayISO, isoToDate, weekStartISO, weekRange } from "../dates.js";

const DAY_MS = 86_400_000;

const WEEKDAY_KEY = ["sun","mon","tue","wed","thu","fri","sat"];
function weekdayOf(iso) {
  // YYYY-MM-DD → "mon", "tue", etc. (timezone-agnostic per dayType.js logic)
  return WEEKDAY_KEY[isoToDate(iso).getUTCDay()];
}

function targetForDate(user, iso) {
  const sched = user?.weeklySchedule?.[weekdayOf(iso)];
  const isTraining = sched && sched !== "rest";
  return user?.targets?.[isTraining ? "trainingDay" : "restDay"] || null;
}

export async function computeInsights(userId, refDate = todayISO()) {
  const user = await User.findById(userId).lean();
  if (!user) return { current: [], patterns: [], warnings: [] };

  // Pull a generous window for trend analysis.
  const trail = (days) => {
    const end = isoToDate(refDate);
    const start = new Date(end.getTime() - (days - 1) * DAY_MS);
    return { start: fmtISO(start), end: fmtISO(end) };
  };

  const w28 = trail(28);
  const n28 = trail(28);
  const e28 = trail(28);

  const [weights, nutrition, entries, trackers, measurements] = await Promise.all([
    Weight.find({ userId, date: { $gte: w28.start, $lte: w28.end } }).sort({ date: 1 }).lean(),
    NutritionEntry.find({ userId, date: { $gte: n28.start, $lte: n28.end } }).sort({ date: 1 }).lean(),
    Entry.find({ userId, date: { $gte: e28.start, $lte: e28.end } }).sort({ date: 1 }).lean(),
    Tracker.find({ userId, archivedAt: null }).lean(),
    Measurement.find({ userId, waistCm: { $ne: null } }).sort({ date: 1 }).lean(),
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
    if (dayKeys.length >= 7) {
      let hit = 0;
      for (const dayKey of dayKeys) {
        const target = targetForDate(user, dayKey);
        if (!target?.proteinG) continue;
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

  // Weight 7-day trend
  {
    const last7 = weights.filter((w) => isWithin(w.date, refDate, 7));
    const prev7 = weights.filter((w) => isBetween(w.date, refDate, 7, 14));
    if (last7.length >= 4 && prev7.length >= 4) {
      const a = avg(last7.map((w) => w.weightKg));
      const b = avg(prev7.map((w) => w.weightKg));
      const delta = a - b;
      insights.push({
        id: "weight-trend-7d",
        category: "current",
        text: `${delta < 0 ? "Down" : delta > 0 ? "Up" : "Flat"} ${Math.abs(delta).toFixed(2)} kg vs last week's avg`,
        severity: delta < -0.1 ? "positive" : delta > 0.1 ? "warning" : "neutral",
        meta: { delta, avg7: a, avg14: b },
      });
    }
  }

  // Training streak
  {
    const streak = trainingStreak(user, entries, trackers, refDate);
    if (streak >= 5) {
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
  // 28-day weight trajectory
  {
    if (weights.length >= 21) {
      const slope = linearSlope(weights.map((w) => ({ x: dayOffset(w.date, refDate), y: w.weightKg })));
      const per7 = slope * 7;
      insights.push({
        id: "weight-trend-28d",
        category: "patterns",
        text: `${per7 < 0 ? "Losing" : per7 > 0 ? "Gaining" : "Holding"} ${Math.abs(per7).toFixed(2)} kg/wk over last 4 weeks`,
        severity: per7 < 0 ? "positive" : per7 > 0 ? "warning" : "neutral",
        meta: { perWeek: per7, samples: weights.length },
      });
    }
  }

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

  // Waist trend
  {
    if (measurements.length >= 2) {
      const first = measurements[0];
      const last  = measurements[measurements.length - 1];
      const days = dayOffset(first.date, last.date);
      if (days >= 7) {
        const delta = last.waistCm - first.waistCm;
        insights.push({
          id: "waist-trend",
          category: "patterns",
          text: `Waist ${delta < 0 ? "−" : "+"}${Math.abs(delta).toFixed(1)} cm over ${days} days`,
          severity: delta < 0 ? "positive" : delta > 0 ? "warning" : "neutral",
          meta: { delta, days },
        });
      }
    }
  }

  // ===== WARNINGS =====
  // Yesterday low protein
  {
    const y = fmtISO(new Date(isoToDate(refDate).getTime() - DAY_MS));
    const yMeals = nutrition.filter((m) => m.date === y);
    if (yMeals.length > 0) {
      const target = targetForDate(user, y);
      if (target?.proteinG) {
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
  }

  // Weight stall: 3 weekly rolling avgs within 0.4 kg range
  {
    if (weights.length >= 21) {
      const wAvgs = [];
      for (let i = 0; i < 3; i++) {
        const winEnd = new Date(isoToDate(refDate).getTime() - (i * 7) * DAY_MS);
        const ws = weights.filter((w) => isWithin(w.date, fmtISO(winEnd), 7));
        if (ws.length >= 4) wAvgs.push(avg(ws.map((w) => w.weightKg)));
      }
      if (wAvgs.length === 3) {
        const range = Math.max(...wAvgs) - Math.min(...wAvgs);
        if (range < 0.4) {
          insights.push({
            id: "weight-stall",
            category: "warnings",
            text: `Weight stalled — 3 weeks within ${range.toFixed(2)} kg`,
            severity: "warning",
            meta: { range, avgs: wAvgs },
          });
        }
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

  // Training miss earlier this week (a scheduled training day with no entry)
  {
    const wr = weekRange(refDate);
    const weekDays = enumerateDates(wr.start, refDate);
    for (const day of weekDays) {
      if (day === refDate) continue; // today still has time
      const sched = user.weeklySchedule?.[weekdayOf(day)];
      if (!sched || sched === "rest") continue;
      const hasEntry = entries.some((e) => e.date === day);
      if (!hasEntry) {
        insights.push({
          id: `training-miss-${day}`,
          category: "warnings",
          text: `Skipped ${prettyDay(day)} training (${sched})`,
          severity: "warning",
          meta: { date: day, scheduled: sched },
        });
        break; // only surface the most recent miss
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
function isWithin(dateIso, refIso, days) {
  const diff = (isoToDate(refIso).getTime() - isoToDate(dateIso).getTime()) / DAY_MS;
  return diff >= 0 && diff < days;
}
function isBetween(dateIso, refIso, fromDays, toDays) {
  const diff = (isoToDate(refIso).getTime() - isoToDate(dateIso).getTime()) / DAY_MS;
  return diff >= fromDays && diff < toDays;
}
function dayOffset(from, to) {
  return Math.round((isoToDate(to).getTime() - isoToDate(from).getTime()) / DAY_MS);
}
function fmtISO(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
}
function linearSlope(points) {
  const n = points.length;
  const sx = points.reduce((s, p) => s + p.x, 0);
  const sy = points.reduce((s, p) => s + p.y, 0);
  const sxy = points.reduce((s, p) => s + p.x * p.y, 0);
  const sxx = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sxx - sx * sx;
  return denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
}
function enumerateDates(startIso, endIso) {
  const out = [];
  let cur = isoToDate(startIso);
  const end = isoToDate(endIso);
  while (cur.getTime() <= end.getTime()) {
    out.push(fmtISO(cur));
    cur = new Date(cur.getTime() + DAY_MS);
  }
  return out;
}
function prettyDay(iso) {
  return new Date(iso + "T12:00:00").toLocaleString("en", { weekday: "long", timeZone: "America/Bogota" });
}
function trainingStreak(user, entries, trackers, refDate) {
  const trackerSet = new Set(trackers.filter((t) => t.kind === "workout").map((t) => String(t._id)));
  let streak = 0;
  let cur = isoToDate(refDate);
  while (true) {
    const day = fmtISO(cur);
    const sched = user.weeklySchedule?.[weekdayOf(day)];
    if (!sched) break;
    if (sched === "rest") { cur = new Date(cur.getTime() - DAY_MS); continue; }
    const did = entries.some((e) => e.date === day && trackerSet.has(String(e.trackerId)));
    if (!did) break;
    streak += 1;
    cur = new Date(cur.getTime() - DAY_MS);
  }
  return streak;
}
