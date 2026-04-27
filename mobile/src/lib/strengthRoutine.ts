export type Exercise = {
  name: string;
  focus: string;
  sets: string;
  reps: string;
  rest: string;
  cue: string;
};

export const STRENGTH_ROUTINE: Exercise[] = [
  {
    name: "Pull-ups",
    focus: "width",
    sets: "3 sets",
    reps: "6–10 reps → normal; under 6 → negatives after failure",
    rest: "90s",
    cue: "Controlled, not explosive.",
  },
  {
    name: "One-arm DB row",
    focus: "thickness",
    sets: "3 × 10–12 each side",
    reps: "Pull elbow toward hip, 1s pause, no torso twisting",
    rest: "60s",
    cue: "Equal priority to pull-ups, not secondary.",
  },
  {
    name: "DB floor press",
    focus: "chest",
    sets: "3 × 8–12",
    reps: "Controlled down, pause at bottom, elbows ~45°",
    rest: "60–90s",
    cue: "Last set close to failure, not all sets.",
  },
  {
    name: "DB Romanian deadlift",
    focus: "posterior chain",
    sets: "3 × 8–12",
    reps: "Slow stretch down, strong hip drive up",
    rest: "90s",
    cue: "Your real leg strength movement.",
  },
  {
    name: "Reverse lunges",
    focus: "leg balance",
    sets: "2–3 × 8–10 each leg",
    reps: "Start with 2 sets; recovery fine → 3",
    rest: "60s",
    cue: "Don't turn this into cardio.",
  },
  {
    name: "DB shoulder press",
    focus: "primary visual driver",
    sets: "3 × 8–12",
    reps: "Core tight, no lower back arch",
    rest: "60–90s",
    cue: "This + laterals = your look.",
  },
  {
    name: "Lateral raises",
    focus: "high impact",
    sets: "3 × 12–15",
    reps: "Light weight, slow tempo, control the top",
    rest: "45–60s",
    cue: "Push closer to failure.",
  },
  {
    name: "Plank",
    focus: "core",
    sets: "3 × 30–60s",
    reps: "Tight glutes, neutral spine",
    rest: "—",
    cue: "—",
  },
];
