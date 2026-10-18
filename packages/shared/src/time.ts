import type { Day, Session, Shift, TimeBand } from "./schemas";

export const DAYS: Day[] = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];

export const DAY_LABEL: Record<Day, string> = {
  LUN: "Lunes",
  MAR: "Martes",
  MIE: "Miércoles",
  JUE: "Jueves",
  VIE: "Viernes",
  SAB: "Sábado",
  DOM: "Domingo",
};

export const DAY_SHORT: Record<Day, string> = {
  LUN: "Lun",
  MAR: "Mar",
  MIE: "Mié",
  JUE: "Jue",
  VIE: "Vie",
  SAB: "Sáb",
  DOM: "Dom",
};

/** "13:45" -> 825 */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** 825 -> "13:45" */
export function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "13:45" -> "01:45 p.m", como lo muestra el portal UTP. */
export function to12h(hhmm: string): string {
  const total = toMinutes(hhmm);
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const suffix = h24 >= 12 ? "p.m" : "a.m";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatSession(s: Session): string {
  return `${DAY_LABEL[s.day]} ${to12h(s.start)} a ${to12h(s.end)}`;
}

/** Turno del portal: las clases que empiezan desde las 18:00 van en "Noche". */
export function shiftOf(start: string): Shift {
  return toMinutes(start) >= 18 * 60 ? "NOCHE" : "MANANA";
}

/** Franja fina para las preferencias: mañana < 12:00 ≤ tarde < 18:00 ≤ noche. */
export function bandOf(start: string): TimeBand {
  const m = toMinutes(start);
  if (m < 12 * 60) return "MANANA";
  if (m < 18 * 60) return "TARDE";
  return "NOCHE";
}

interface Interval {
  day: Day;
  start: string;
  end: string;
}

export function overlaps(a: Interval, b: Interval): boolean {
  return a.day === b.day && toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end);
}

/** true si alguna sesión de `a` se cruza con alguna de `b`. */
export function sessionsClash(a: Interval[], b: Interval[]): boolean {
  return a.some((x) => b.some((y) => overlaps(x, y)));
}
