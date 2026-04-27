import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient as SvgRadial, Stop } from "react-native-svg";
import { todayISO, weekDays as weekDaysOf, weekRange } from "../lib/dates";
import { colors, fonts } from "../lib/theme";
import { SparkIcon } from "./Icons";
import type { Entry } from "../lib/api";

type Totals = {
  walks: number;
  walkKm: number;
  squash: number;
  tkd: number;
  strength: number;
  proteinDays: number;
  calories: number;
  byDay: Record<string, number>;
};

const ACTS: Entry["activity"][] = ["walk", "squash", "taekwondo", "strength", "protein"];

function hasSignal(e: Entry): boolean {
  return (
    e.done ||
    e.distanceKm != null ||
    e.durationMin != null ||
    e.rpe != null ||
    e.proteinG != null ||
    !!(e.notes && e.notes.length > 0)
  );
}

function computeTotals(days: string[], entries: Entry[]): Totals {
  const t: Totals = {
    walks: 0,
    walkKm: 0,
    squash: 0,
    tkd: 0,
    strength: 0,
    proteinDays: 0,
    calories: 0,
    byDay: {},
  };
  const byKey: Record<string, Entry> = {};
  for (const e of entries) byKey[`${e.date}|${e.activity}`] = e;

  for (const d of days) {
    let done = 0;
    let tracked = 0;
    for (const a of ACTS) {
      const e = byKey[`${d}|${a}`];
      if (!e) continue;
      if (e.done) {
        done += 1;
        if (a === "walk") {
          t.walks += 1;
          t.walkKm += Number(e.distanceKm) || 0;
        }
        if (a === "squash") t.squash += 1;
        if (a === "taekwondo") t.tkd += 1;
        if (a === "strength") t.strength += 1;
        if (a === "protein") t.proteinDays += 1;
      }
      if (hasSignal(e)) tracked += 1;
      if (e.caloriesBurned) t.calories += Number(e.caloriesBurned) || 0;
    }
    t.byDay[d] = tracked ? done / tracked : 0;
  }
  return t;
}

function weekRangeLabel(start: string, end: string): string {
  const sd = new Date(start + "T12:00:00");
  const ed = new Date(end + "T12:00:00");
  const sm = sd.toLocaleString("en", { month: "short" });
  const em = ed.toLocaleString("en", { month: "short" });
  return `${sm} ${sd.getDate()} — ${sm === em ? "" : em + " "}${ed.getDate()}`;
}

const DAY_INITIALS = ["m", "t", "w", "t", "f", "s", "s"];

export default function WeeklyHero({
  selectedDate,
  weekEntries,
  onSelectDate,
  onOpenCoach,
}: {
  selectedDate: string;
  weekEntries: Entry[];
  onSelectDate: (iso: string) => void;
  onOpenCoach: () => void;
}) {
  const days = weekDaysOf(selectedDate);
  const range = weekRange(selectedDate);
  const totals = computeTotals(days, weekEntries);
  const today = todayISO();

  return (
    <View style={styles.card}>
      {/* coral glow */}
      <View style={styles.glowWrap} pointerEvents="none">
        <Svg width="220" height="220" viewBox="0 0 220 220">
          <Defs>
            <SvgRadial id="g" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={colors.accent} stopOpacity="0.2" />
              <Stop offset="1" stopColor={colors.accent} stopOpacity="0" />
            </SvgRadial>
          </Defs>
          <Circle cx="110" cy="110" r="110" fill="url(#g)" />
        </Svg>
      </View>

      {/* title */}
      <View>
        <Text style={styles.title}>This week</Text>
        <Text style={styles.range}>{weekRangeLabel(range.start, range.end)}</Text>
        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      {/* goal tiles */}
      <View style={styles.tilesRow}>
        <GoalTile label="walk" cur={totals.walks} goal={7} sub={`${totals.walkKm.toFixed(1)}/42 km`} />
        <GoalTile label="squash" cur={totals.squash} goal={3} />
        <GoalTile label="tkd" cur={totals.tkd} goal={3} />
        <GoalTile label="strength" cur={totals.strength} goal={1} />
        <GoalTile label="protein" cur={totals.proteinDays} goal={7} />
      </View>

      {/* day strip */}
      <View style={styles.stripBlock}>
        <View style={styles.stripLabels}>
          {DAY_INITIALS.map((d, i) => (
            <Text key={i} style={styles.stripLabel}>{d}</Text>
          ))}
        </View>
        <View style={styles.stripDays}>
          {days.map((iso) => {
            const isToday = iso === today;
            const isSel = iso === selectedDate;
            const completion = totals.byDay[iso] ?? 0;
            return (
              <DayButton
                key={iso}
                iso={iso}
                isToday={isToday}
                isSel={isSel}
                completion={completion}
                onPress={() => onSelectDate(iso)}
              />
            );
          })}
        </View>
      </View>

      {/* footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.kcalLabel}>week burn</Text>
          <View style={styles.kcalRow}>
            <Text style={styles.kcalNum}>{totals.calories.toLocaleString()}</Text>
            <Text style={styles.kcalUnit}>kcal</Text>
          </View>
        </View>
        <Pressable
          onPress={onOpenCoach}
          style={({ pressed }) => [styles.coach, pressed && { opacity: 0.85 }]}
        >
          <SparkIcon size={15} color={colors.inkDark} strokeWidth={2} />
          <Text style={styles.coachText}>talk to coach</Text>
        </Pressable>
      </View>
    </View>
  );
}

function GoalTile({
  label,
  cur,
  goal,
  sub,
}: {
  label: string;
  cur: number;
  goal: number;
  sub?: string;
}) {
  const pct = Math.max(0, Math.min(1, cur / goal));
  const done = cur >= goal;
  return (
    <View style={[styles.tile, sub && { minHeight: 76 }]}>
      <Text style={styles.tileLabel}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
        <Text style={[styles.tileValue, { color: done ? colors.accent : colors.cream }]}>{cur}</Text>
        <Text style={styles.tileGoal}>/{goal}</Text>
      </View>
      {sub ? <Text style={styles.tileSub}>{sub}</Text> : null}
      <View style={styles.tileBar}>
        <View
          style={[
            styles.tileBarFill,
            { width: `${pct * 100}%`, backgroundColor: done ? colors.accent : "rgba(244,239,229,0.4)" },
          ]}
        />
      </View>
    </View>
  );
}

function DayButton({
  iso,
  isToday,
  isSel,
  completion,
  onPress,
}: {
  iso: string;
  isToday: boolean;
  isSel: boolean;
  completion: number;
  onPress: () => void;
}) {
  const day = Number(iso.slice(8, 10));
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.day,
        isSel && { backgroundColor: colors.accent },
        isToday && !isSel && { borderColor: "rgba(244,239,229,0.4)", borderWidth: 1 },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text
        style={[
          styles.dayNum,
          { color: isSel ? colors.inkDark : isToday ? colors.cream : "rgba(244,239,229,0.75)" },
        ]}
      >
        {day}
      </Text>
      {!isSel && completion > 0 ? (
        <Svg
          style={StyleSheet.absoluteFill}
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
        >
          <Circle
            cx="50"
            cy="50"
            r="49"
            fill="none"
            stroke={colors.accent}
            strokeWidth="2"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            // @ts-ignore react-native-svg supports pathLength
            pathLength={100}
            strokeDasharray={`${completion * 100} 100`}
            transform="rotate(-90 50 50)"
          />
        </Svg>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.inkDark,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    overflow: "hidden",
  },
  glowWrap: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 220,
    height: 220,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 34,
    color: colors.cream,
    letterSpacing: -0.5,
  },
  range: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.cream50,
    marginTop: 6,
    letterSpacing: 0.3,
  },
  dots: {
    position: "absolute",
    top: 4,
    right: 0,
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.cream35,
  },

  tilesRow: { flexDirection: "row", gap: 6, marginTop: 22 },
  tile: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "rgba(244,239,229,0.05)",
    borderWidth: 1,
    borderColor: "rgba(244,239,229,0.06)",
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 10,
    minHeight: 64,
    justifyContent: "space-between",
  },
  tileLabel: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 0.6,
    color: colors.cream50,
    textTransform: "uppercase",
  },
  tileValue: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  tileGoal: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.cream35,
  },
  tileSub: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.cream35,
    marginTop: 1,
  },
  tileBar: {
    height: 3,
    backgroundColor: "rgba(244,239,229,0.08)",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 8,
  },
  tileBarFill: { height: 3 },

  stripBlock: {
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(244,239,229,0.08)",
  },
  stripLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  stripLabel: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: 11,
    color: "rgba(244,239,229,0.4)",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  stripDays: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  day: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: "rgba(244,239,229,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  dayNum: {
    fontFamily: fonts.sansSemibold,
    fontSize: 14,
    letterSpacing: -0.3,
  },

  footer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(244,239,229,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  kcalLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: "rgba(244,239,229,0.45)",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  kcalRow: { flexDirection: "row", alignItems: "baseline", marginTop: 4, gap: 4 },
  kcalNum: {
    fontFamily: fonts.serif,
    fontSize: 34,
    color: colors.cream,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  kcalUnit: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream50,
  },
  coach: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  coachText: {
    fontFamily: fonts.sansSemibold,
    fontSize: 13,
    color: colors.inkDark,
    letterSpacing: -0.1,
  },
});
