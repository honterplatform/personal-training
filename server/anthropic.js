import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-6";

const MET = {
  walk: 3.5,
  squash: 7.3,
  taekwondo: 10.0,
  strength: 5.0,
};

function fallbackCalories({ activity, durationMin, rpe, bodyWeightKg }) {
  const met = MET[activity] ?? 4.0;
  const weight = Number(bodyWeightKg) || 75;
  const mins = Number(durationMin) || 0;
  let kcal = met * weight * (mins / 60);
  if (rpe && rpe > 0) {
    kcal *= 0.7 + Number(rpe) * 0.06;
  }
  return Math.max(0, Math.round(kcal));
}

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

export async function estimateCalories({ activity, durationMin, rpe, bodyWeightKg }) {
  if (!durationMin || durationMin <= 0) return 0;
  const client = getClient();
  if (!client) return fallbackCalories({ activity, durationMin, rpe, bodyWeightKg });

  const prompt = `Estimate calories burned for this session. Return ONLY a strict JSON object with integer calories.

Activity: ${activity}
Duration (min): ${durationMin}
RPE (1-10): ${rpe ?? "not provided"}
Body weight (kg): ${bodyWeightKg}

Respond with exactly: {"calories": <integer>}`;

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
    return fallbackCalories({ activity, durationMin, rpe, bodyWeightKg });
  }
}

export async function weeklySummary({ entries, settings, weekStart }) {
  const client = getClient();
  if (!client) return "Summary unavailable, try again in a moment.";

  const rows = entries
    .map((e) => {
      const parts = [e.date, e.activity, e.done ? "✓" : "–"];
      if (e.distanceKm != null) parts.push(`${e.distanceKm}km`);
      if (e.durationMin != null) parts.push(`${e.durationMin}min`);
      if (e.rpe != null) parts.push(`RPE${e.rpe}`);
      if (e.proteinG != null) parts.push(`${e.proteinG}g protein`);
      if (e.caloriesBurned != null) parts.push(`${e.caloriesBurned}kcal`);
      if (e.notes) parts.push(`"${e.notes}"`);
      return parts.join(" · ");
    })
    .join("\n");

  const prompt = `You are a training coach reviewing one week (starting ${weekStart}) for an athlete. Speak directly to them, no markdown headers, no lists, max ~180 words. Cover: what hit targets, what didn't, one pattern observation, one thing to watch next week. Plain text only.

Weekly targets: 7 walks totaling 42km, 3 squash, 3 taekwondo, 1 strength, ${settings.proteinGoalG}g protein daily. Body weight: ${settings.bodyWeightKg}kg.

Entries:
${rows || "(no entries this week)"}`;

  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      temperature: 0.7,
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
