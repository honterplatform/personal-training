const TZ = "America/Bogota";

function partsInTZ(d) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = fmt.formatToParts(d).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  return parts;
}

export function todayISO() {
  const p = partsInTZ(new Date());
  return `${p.year}-${p.month}-${p.day}`;
}

export function isoToDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export function weekStartISO(iso) {
  const d = isoToDate(iso);
  const p = partsInTZ(d);
  const weekday = p.weekday;
  const map = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const offset = map[weekday] ?? 0;
  const start = new Date(d.getTime() - offset * 24 * 60 * 60 * 1000);
  const sp = partsInTZ(start);
  return `${sp.year}-${sp.month}-${sp.day}`;
}

export function weekRange(iso) {
  const start = weekStartISO(iso);
  const sd = isoToDate(start);
  const end = new Date(sd.getTime() + 6 * 24 * 60 * 60 * 1000);
  const ep = partsInTZ(end);
  return { start, end: `${ep.year}-${ep.month}-${ep.day}` };
}
