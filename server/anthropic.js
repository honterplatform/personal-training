import Anthropic from "@anthropic-ai/sdk";

const ESTIMATION_MODEL = "claude-haiku-4-5-20251001";
const COACH_MODEL = "claude-sonnet-4-6";

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

// ---------- MET fallback (used if API fails or key missing) ----------

const MET_BUCKETS = [
  { match: /walk|stroll/i,                         met: 3.5 },
  { match: /run|jog/i,                             met: 9.0 },
  { match: /cycle|cycling|bike|biking/i,           met: 7.5 },
  { match: /swim/i,                                met: 8.0 },
  { match: /squash|racquetball/i,                  met: 7.3 },
  { match: /tennis|padel|pickleball|badminton/i,   met: 6.5 },
  { match: /taekwondo|karate|judo|bjj|martial/i,   met: 10.0 },
  { match: /box(?:ing)?|kickbox/i,                 met: 9.0 },
  { match: /crossfit|hiit|interval/i,              met: 8.0 },
  { match: /strength|lift|weight|gym/i,            met: 5.0 },
  { match: /yoga|stretch|pilates|mobility/i,       met: 3.0 },
  { match: /hike|hiking|climb/i,                   met: 7.0 },
  { match: /soccer|football|basketball|hockey/i,   met: 8.0 },
  { match: /dance|salsa|zumba/i,                   met: 6.0 },
  { match: /rowing|elliptical/i,                   met: 7.0 },
];

function fallbackCalories({ activityName, durationMin, rpe, bodyWeightKg, sex, age, fitnessLevel }) {
  const bucket = MET_BUCKETS.find((b) => b.match.test(activityName || ""));
  const met = bucket?.met ?? 5.0;
  const weight = Number(bodyWeightKg) || 75;
  const mins = Number(durationMin) || 0;
  let kcal = met * weight * (mins / 60);
  if (rpe && rpe > 0) kcal *= 0.7 + Number(rpe) * 0.06;
  if (sex === "female") kcal *= 0.92;
  else if (sex === "other") kcal *= 0.96;
  if (age && age > 25) kcal *= Math.max(0.85, 1 - (Number(age) - 25) * 0.002);
  if (fitnessLevel === "intermediate") kcal *= 0.96;
  else if (fitnessLevel === "advanced") kcal *= 0.92;
  return Math.max(0, Math.round(kcal));
}

// ---------- Calorie estimate (Haiku) ----------

export async function estimateCalories({
  activityName,
  durationMin,
  rpe,
  bodyWeightKg,
  heightCm,
  sex,
  age,
  fitnessLevel,
}) {
  if (!durationMin || durationMin <= 0) return { calories: 0, source: "ai" };
  const fallback = () => ({
    calories: fallbackCalories({ activityName, durationMin, rpe, bodyWeightKg, sex, age, fitnessLevel }),
    source: "fallback",
  });

  const client = getClient();
  if (!client) return fallback();

  const athleteLines = [
    bodyWeightKg ? `Body weight: ${bodyWeightKg} kg` : null,
    heightCm ? `Height: ${heightCm} cm` : null,
    sex ? `Sex: ${sex}` : null,
    age ? `Age: ${age}` : null,
    fitnessLevel ? `Fitness level: ${fitnessLevel}` : null,
  ].filter(Boolean).join("\n  ");

  const prompt = `Estimate calories burned for one session using standard exercise physiology (MET × body weight × hours, adjusted by intensity and the athlete's profile).

Session:
  Activity: ${activityName}
  Duration: ${durationMin} minutes
  RPE (1-10, perceived effort): ${rpe ?? "not provided"}

Athlete:
  ${athleteLines || "(no demographic data)"}

If the activity is unfamiliar, infer the closest analogous activity by movement pattern and intensity. Account for sex/age/fitness shifting burn vs the 75 kg male default.

Return ONLY a strict JSON object: {"calories": <integer>}`;

  try {
    const resp = await client.messages.create({
      model: ESTIMATION_MODEL,
      max_tokens: 100,
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    });
    const text = resp.content.filter((c) => c.type === "text").map((c) => c.text).join("");
    const match = text.match(/\{[^}]*"calories"[^}]*\}/);
    if (!match) throw new Error("no json in response");
    const parsed = JSON.parse(match[0]);
    const cals = Math.round(Number(parsed.calories));
    if (!Number.isFinite(cals) || cals < 0) throw new Error("bad calories");
    return { calories: cals, source: "ai" };
  } catch (err) {
    console.error("[anthropic] calorie estimate failed:", err.message);
    return fallback();
  }
}

// ---------- Coach context ----------

function buildContextBlock({ user, trackers, weekEntries, weekStart, selectedDate, dayEntries }) {
  const trackerById = Object.fromEntries(trackers.map((t) => [String(t._id), t]));

  const weeklyTotals = {};
  for (const t of trackers) {
    weeklyTotals[String(t._id)] = { sessions: 0, minutes: 0, km: 0, amount: 0, calories: 0 };
  }
  for (const e of weekEntries) {
    const tid = String(e.trackerId);
    if (!weeklyTotals[tid]) continue;
    const tracker = trackerById[tid];
    if (tracker?.kind === "workout") {
      weeklyTotals[tid].sessions += 1;
      if (e.durationMin) weeklyTotals[tid].minutes += Number(e.durationMin);
      if (e.distanceKm) weeklyTotals[tid].km += Number(e.distanceKm);
      if (e.caloriesBurned) weeklyTotals[tid].calories += Number(e.caloriesBurned);
    } else if (tracker?.kind === "intake") {
      if (e.amount) weeklyTotals[tid].amount += Number(e.amount);
    }
  }

  const trackerLines = trackers
    .map((t) => {
      const tot = weeklyTotals[String(t._id)] || {};
      const target = t.target?.value
        ? `target ${t.target.value} ${t.target.metric}/${t.target.period}`
        : "no target";
      if (t.kind === "workout") {
        return `  · ${t.name} (workout) — ${tot.sessions} sessions / ${Math.round(tot.minutes)} min / ${tot.km.toFixed(1)} km / ${tot.calories} kcal · ${target}`;
      }
      return `  · ${t.name} (intake, ${t.unit || "—"}) — total ${tot.amount}${t.unit || ""} · ${target}`;
    })
    .join("\n");

  const dayLines = dayEntries
    .map((e) => {
      const t = trackerById[String(e.trackerId)];
      if (!t) return null;
      const parts = [t.name];
      if (e.durationMin != null) parts.push(`${e.durationMin}min`);
      if (e.distanceKm != null) parts.push(`${e.distanceKm}km`);
      if (e.rpe != null) parts.push(`RPE${e.rpe}`);
      if (e.amount != null) parts.push(`${e.amount}${t.unit || ""}`);
      if (e.caloriesBurned != null) parts.push(`${e.caloriesBurned}kcal`);
      if (e.notes) parts.push(`"${e.notes}"`);
      return "  · " + parts.join(" · ");
    })
    .filter(Boolean)
    .join("\n");

  const totalKcal = Object.values(weeklyTotals).reduce((s, v) => s + (v.calories || 0), 0);

  const demo = user.demographics || {};
  const aboutLines = [
    demo.weightKg ? `weight ${demo.weightKg}kg` : null,
    demo.heightCm ? `height ${demo.heightCm}cm` : null,
    demo.sex ? `${demo.sex}` : null,
    demo.age ? `${demo.age}yo` : null,
    demo.fitnessLevel ? `${demo.fitnessLevel}` : null,
  ].filter(Boolean).join(", ") || "(no demographic data)";

  return `--- ATHLETE CONTEXT (regenerated each turn — use as ground truth) ---
About: ${aboutLines}

Trackers + this week's totals (week starting ${weekStart}):
${trackerLines || "  (no trackers yet)"}

Total kcal burned this week: ${totalKcal}

Selected date: ${selectedDate}
Entries on selected date:
${dayLines || "  (nothing logged)"}
--- END CONTEXT ---`;
}

const COACH_SYSTEM = `You are a direct, grounded personal training coach for one athlete. You have access to their settings, trackers, and training data, refreshed each turn in the ATHLETE CONTEXT block.

Rules:
- ONLY reference sessions/entries that appear in the context. NEVER invent.
- Be honest about what is missing or off-target. "0 sessions" means missed.
- Reply in 1 to 4 sentences by default; expand only when asked.
- Plain text only — no markdown, no bullets unless the user explicitly asks.
- Speak directly to the athlete in second person. Be concise and grounded in the numbers.`;

export async function coachChat({ history, userMessage, contextArgs }) {
  const client = getClient();
  if (!client) return "Coach is offline right now (no API key). Try again later.";

  const context = buildContextBlock(contextArgs);
  const messages = [];
  for (const m of history || []) {
    if (m.role === "user" || m.role === "assistant") {
      messages.push({ role: m.role, content: m.content });
    }
  }
  messages.push({ role: "user", content: `${context}\n\n${userMessage}` });

  try {
    const resp = await client.messages.create({
      model: COACH_MODEL,
      max_tokens: 600,
      temperature: 0.5,
      system: COACH_SYSTEM,
      messages,
    });
    return resp.content.filter((c) => c.type === "text").map((c) => c.text).join("").trim();
  } catch (err) {
    console.error("[anthropic] coach chat failed:", err.message);
    return "Coach is having trouble responding. Try again in a moment.";
  }
}

export async function coachOpener({ contextArgs }) {
  const client = getClient();
  if (!client) return "Welcome back. Log a session and I'll have something to coach against.";

  const totals = (contextArgs.weekEntries || []).filter((e) => e.caloriesBurned).length;
  if ((contextArgs.weekEntries || []).length === 0) {
    return "Fresh week — nothing logged yet. When you finish a session, log it and I'll start tracking. Ask me anything in the meantime.";
  }

  const context = buildContextBlock(contextArgs);
  try {
    const resp = await client.messages.create({
      model: COACH_MODEL,
      max_tokens: 280,
      temperature: 0.6,
      system: COACH_SYSTEM,
      messages: [
        {
          role: "user",
          content: `${context}\n\nGreet the athlete in 2-3 sentences. Mention one specific positive from the week so far and one thing to watch. End with an invitation to ask questions.`,
        },
      ],
    });
    return resp.content.filter((c) => c.type === "text").map((c) => c.text).join("").trim();
  } catch (err) {
    console.error("[anthropic] opener failed:", err.message);
    return "Hey — I'm here. Ask me anything about your week.";
  }
}
