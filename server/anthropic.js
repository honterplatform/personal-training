import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-6";

const MET = {
  walk: 3.5,
  squash: 7.3,
  taekwondo: 10.0,
  strength: 5.0,
};

function fallbackCalories({ activity, durationMin, rpe, bodyWeightKg, sex, age, fitnessLevel }) {
  const met = MET[activity] ?? 4.0;
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

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

export async function estimateCalories({ activity, durationMin, rpe, bodyWeightKg, sex, age, fitnessLevel }) {
  if (!durationMin || durationMin <= 0) return 0;
  const client = getClient();
  const fbArgs = { activity, durationMin, rpe, bodyWeightKg, sex, age, fitnessLevel };
  if (!client) return fallbackCalories(fbArgs);

  const prompt = `Estimate calories burned for this session using standard exercise physiology. Return ONLY a strict JSON object with integer calories, no prose.

Session:
- Activity: ${activity}
- Duration: ${durationMin} min
- RPE (1-10, perceived effort): ${rpe ?? "not provided"}

Athlete:
- Body weight: ${bodyWeightKg} kg
- Sex: ${sex || "not provided"}
- Age: ${age ?? "not provided"}
- Fitness level: ${fitnessLevel || "not provided"} ${fitnessLevel ? "(more fit = more metabolic efficiency = slightly fewer kcal for the same work)" : ""}

Account for the activity's typical MET, how effort (RPE) scales intensity, and how sex/age/fitness shift burn vs the 75kg male default. Respond with exactly: {"calories": <integer>}`;

  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 100,
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    });
    const text = resp.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("");
    const match = text.match(/\{[^}]*"calories"[^}]*\}/);
    if (!match) throw new Error("no json in response");
    const parsed = JSON.parse(match[0]);
    const cals = Math.round(Number(parsed.calories));
    if (!Number.isFinite(cals) || cals < 0) throw new Error("bad calories");
    return cals;
  } catch (err) {
    console.error("[anthropic] calorie estimate failed:", err.message);
    return fallbackCalories(fbArgs);
  }
}

function computeWeeklyTotals(entries) {
  const t = { walks: 0, walkKm: 0, squash: 0, tkd: 0, strength: 0, proteinDays: 0, calories: 0 };
  for (const e of entries) {
    if (e.caloriesBurned) t.calories += Number(e.caloriesBurned) || 0;
    if (!e.done) continue;
    if (e.activity === "walk") {
      t.walks += 1;
      t.walkKm += Number(e.distanceKm) || 0;
    }
    if (e.activity === "squash") t.squash += 1;
    if (e.activity === "taekwondo") t.tkd += 1;
    if (e.activity === "strength") t.strength += 1;
    if (e.activity === "protein") t.proteinDays += 1;
  }
  t.totalDone = t.walks + t.squash + t.tkd + t.strength + t.proteinDays;
  return t;
}

export async function weeklySummary({ entries, settings, weekStart }) {
  const totals = computeWeeklyTotals(entries);

  if (totals.totalDone === 0) {
    return `Week of ${weekStart} is still empty — no completed sessions yet. Log a walk, a training, or your protein and check back once there's real data to review.`;
  }

  const client = getClient();
  if (!client) return "Summary unavailable, try again in a moment.";

  const rows = entries
    .map((e) => {
      const parts = [e.date, e.activity, e.done ? "DONE" : "not done"];
      if (e.distanceKm != null) parts.push(`${e.distanceKm}km`);
      if (e.durationMin != null) parts.push(`${e.durationMin}min`);
      if (e.rpe != null) parts.push(`RPE${e.rpe}`);
      if (e.proteinG != null) parts.push(`${e.proteinG}g protein`);
      if (e.caloriesBurned != null) parts.push(`${e.caloriesBurned}kcal`);
      if (e.notes) parts.push(`"${e.notes}"`);
      return parts.join(" · ");
    })
    .join("\n");

  const prompt = `You are a direct, grounded training coach. Review ONE week for this athlete and write a short coach note.

CRITICAL RULES:
- ONLY reference sessions that appear in the DATA below. Do NOT invent sessions, durations, distances, or patterns.
- Use the AUTHORITATIVE TOTALS as ground truth — if a count is 0, say "missed" or "none logged", never fabricate results.
- If data is sparse, keep the note short. Don't pad with imagined observations.
- Plain text only, no markdown, no bullet lists, max 150 words.

ATHLETE TARGETS (weekly):
- Walks: 7 sessions totaling 42 km
- Squash: 3 sessions
- Taekwondo: 3 sessions
- Strength: 1 session
- Protein: ${settings.proteinGoalG}g per day (7 days)
Body weight: ${settings.bodyWeightKg}kg.

AUTHORITATIVE TOTALS FOR WEEK OF ${weekStart} (ground truth — do not contradict):
- Walks done: ${totals.walks}/7  (${totals.walkKm.toFixed(1)}/42 km)
- Squash done: ${totals.squash}/3
- Taekwondo done: ${totals.tkd}/3
- Strength done: ${totals.strength}/1
- Protein days hit: ${totals.proteinDays}/7
- Calories burned (estimated): ${totals.calories}

DATA — individual entries (chronological):
${rows}

Now write the coach note. Cover: what hit the target, what was missed, and one concrete thing to focus on next week — grounded entirely in the totals above.`;

  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      temperature: 0.5,
      messages: [{ role: "user", content: prompt }],
    });
    return resp.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("")
      .trim();
  } catch (err) {
    console.error("[anthropic] summary failed:", err.message);
    return "Summary unavailable, try again in a moment.";
  }
}

function buildContextBlock({ settings, weekEntries, weekStart, selectedDate, dayEntries }) {
  const totals = computeWeeklyTotals(weekEntries);
  const dayLines = (dayEntries || [])
    .map((e) => {
      const parts = [e.activity, e.done ? "DONE" : "not done"];
      if (e.distanceKm != null) parts.push(`${e.distanceKm}km`);
      if (e.durationMin != null) parts.push(`${e.durationMin}min`);
      if (e.rpe != null) parts.push(`RPE${e.rpe}`);
      if (e.proteinG != null) parts.push(`${e.proteinG}g protein`);
      if (e.caloriesBurned != null) parts.push(`${e.caloriesBurned}kcal`);
      if (e.notes) parts.push(`"${e.notes}"`);
      return "  · " + parts.join(" · ");
    })
    .join("\n");
  const weekLines = (weekEntries || [])
    .filter((e) => e.done)
    .map((e) => {
      const parts = [e.date, e.activity];
      if (e.distanceKm != null) parts.push(`${e.distanceKm}km`);
      if (e.durationMin != null) parts.push(`${e.durationMin}min`);
      if (e.rpe != null) parts.push(`RPE${e.rpe}`);
      if (e.proteinG != null) parts.push(`${e.proteinG}g`);
      if (e.caloriesBurned != null) parts.push(`${e.caloriesBurned}kcal`);
      return "  · " + parts.join(" · ");
    })
    .join("\n");

  return `--- ATHLETE CONTEXT (regenerated each turn — use as ground truth) ---
Body weight: ${settings?.bodyWeightKg ?? "?"}kg${settings?.sex ? `, ${settings.sex}` : ""}${settings?.age ? `, ${settings.age}yo` : ""}${settings?.fitnessLevel ? `, ${settings.fitnessLevel}` : ""}
Daily protein goal: ${settings?.proteinGoalG ?? "?"}g
Weekly targets: 7 walks (42km total), 3 squash, 3 taekwondo, 1 strength.

Week of ${weekStart} so far:
- Walks done: ${totals.walks}/7  (${totals.walkKm.toFixed(1)}/42 km)
- Squash done: ${totals.squash}/3
- Taekwondo done: ${totals.tkd}/3
- Strength done: ${totals.strength}/1
- Protein days hit: ${totals.proteinDays}/7
- Calories burned this week: ${totals.calories}

This week's completed sessions:
${weekLines || "  (none yet)"}

Selected date: ${selectedDate}
Entries on selected date:
${dayLines || "  (nothing logged)"}
--- END CONTEXT ---`;
}

const COACH_SYSTEM = `You are a direct, grounded personal training coach for one athlete. You have access to their settings and training data, refreshed each turn in the ATHLETE CONTEXT block.

Rules:
- Only reference sessions that appear in the context. NEVER invent sessions, durations, distances, or patterns.
- Keep replies short and conversational by default — 1 to 4 sentences. Expand only when the athlete asks for detail.
- Be honest about what's missing. If a target is at 0/3, say so plainly.
- Plain text only — no markdown headers, no bold, no bullet lists unless explicitly asked.
- The athlete trains in Bogotá local time. Their schedule rotates (taekwondo + squash on alternating days, strength once weekly, walks daily).`;

export async function coachChat({ history, userMessage, contextArgs }) {
  const client = getClient();
  if (!client) {
    return "Coach is offline right now (no API key). Try again later.";
  }

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
      model: MODEL,
      max_tokens: 600,
      temperature: 0.5,
      system: COACH_SYSTEM,
      messages,
    });
    return resp.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("")
      .trim();
  } catch (err) {
    console.error("[anthropic] coach chat failed:", err.message);
    return "Coach is having trouble responding. Try again in a moment.";
  }
}

export async function coachOpener({ contextArgs }) {
  const client = getClient();
  if (!client) return "Welcome back. Log a session and I'll have something to coach against.";

  const totals = computeWeeklyTotals(contextArgs.weekEntries || []);
  if (totals.totalDone === 0) {
    return "Fresh week — nothing logged yet. When you finish a session, mark it done and I'll start tracking. Ask me anything in the meantime.";
  }

  const context = buildContextBlock(contextArgs);
  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      temperature: 0.6,
      system: COACH_SYSTEM,
      messages: [
        {
          role: "user",
          content: `${context}\n\nGreet the athlete in 2-3 sentences. Mention one specific positive from the week so far and one thing to watch. End with an invitation to ask questions.`,
        },
      ],
    });
    return resp.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("")
      .trim();
  } catch (err) {
    console.error("[anthropic] opener failed:", err.message);
    return "Hey — I'm here. Ask me anything about your week.";
  }
}
