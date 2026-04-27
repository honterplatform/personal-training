const TZ = "America/Bogota";

function partsInTZ(d: Date) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  return fmt.formatToParts(d).reduce<Record<string, string>>((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
}

export function todayISO(): string {
  const p = partsInTZ(new Date());
  return `${p.year}-${p.month}-${p.day}`;
}

export function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export function weekStartISO(iso: string): string {
  const d = isoToDate(iso);
  const p = partsInTZ(d);
  const map: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const offset = map[p.weekday] ?? 0;
  const start = new Date(d.getTime() - offset * 86_400_000);
  const sp = partsInTZ(start);
  return `${sp.year}-${sp.month}-${sp.day}`;
}

export function weekDays(iso: string): string[] {
  const start = weekStartISO(iso);
  const sd = isoToDate(start);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sd.getTime() + i * 86_400_000);
    const p = partsInTZ(d);
    return `${p.year}-${p.month}-${p.day}`;
  });
}

export function weekRange(iso: string): { start: string; end: string } {
  const days = weekDays(iso);
  return { start: days[0], end: days[6] };
}

export function weekday(iso: string, full = true): string {
  const d = isoToDate(iso);
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: full ? "long" : "short" }).format(d);
}

export function monthLong(iso: string): string {
  const d = isoToDate(iso);
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "long" }).format(d);
}

export function dayOfMonth(iso: string): number {
  return Number(iso.slice(8, 10));
}
