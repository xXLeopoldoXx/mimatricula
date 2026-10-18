import {
  bandOf,
  DAY_LABEL,
  DAY_SHORT,
  DAYS,
  sessionsClash,
  toMinutes,
  type BusyBlock,
  type Course,
  type Day,
  type EnrollmentOffer,
  type ProfessorStats,
  type Section,
  type StudentPreferences,
  type TimeBand,
} from "@mimatricula/shared";

export interface GenerateInput {
  offer: EnrollmentOffer;
  stats: Map<string, ProfessorStats>;
  prefs: StudentPreferences;
  /** Tope de créditos del periodo (la universidad fija 22). */
  maxCredits: number;
  /** Cuántas opciones devolver. */
  limit?: number;
  /** Corte de seguridad para que el navegador no se congele. */
  maxNodes?: number;
}

export interface Assignment {
  course: Course;
  section: Section;
  /** Nota ajustada del docente llevada a 0–1 (0.5 si no tiene reseñas). Es lo que se optimiza. */
  quality: number;
  /** Promedio de reseñas del docente (1–5), para mostrar. */
  professorScore?: number;
}

export interface ScheduleOption {
  picks: Assignment[];
  credits: number;
  costPen: number;
  /** Promedio de la nota docente, de 0 a 1. */
  quality: number;
  /** Comodidad del horario, de 0 a 1: menos días y menos horas muertas. */
  comfort: number;
  /** Mezcla de calidad y comodidad según la preferencia del estudiante. */
  total: number;
  days: Day[];
  /** Minutos libres entre clases el mismo día (sin contar recreos de 15 min). */
  gapMinutes: number;
  highlights: string[];
}

export type Filter = "VACANTES" | "TURNO" | "DIAS_LIBRES" | "TRABAJO";

export interface CourseDiagnosis {
  course: Course;
  total: number;
  /** Secciones que pasan cada filtro, en orden. */
  passed: Record<Filter, number>;
  candidates: Section[];
  /** Primer filtro que dejó al curso sin secciones. */
  blockedBy?: Filter;
}

export interface GenerateResult {
  options: ScheduleOption[];
  diagnosis: CourseDiagnosis[];
  /** Cursos que no entraron en la mejor opción, con el motivo. */
  left: { course: Course; reason: string }[];
  /** Sugerencias para cuando faltan cursos (qué preferencia aflojar). */
  tips: string[];
  creditCap: number;
  explored: number;
  /** false si la búsqueda se cortó por `maxNodes` (el resultado sigue siendo válido). */
  complete: boolean;
}

const EPS = 1e-6;
const BREAK_MIN = 15;
/** Con igual puntaje, gana el horario más cómodo. */
const TIEBREAK = 1e-3;
const BAND_LABEL: Record<TimeBand, string> = { MANANA: "mañana", TARDE: "tarde", NOCHE: "noche" };

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Repetidos primero (obligatorio en la UTP), luego obligatorios y al final electivos. */
export function priorityOf(c: Course): number {
  if (c.repeated) return 3;
  return c.type === "OBLIGATORIO" ? 2 : 1;
}

function hitsBusy(section: Section, busy: BusyBlock[], bufferMin: number): boolean {
  return section.sessions.some((s) =>
    busy.some(
      (b) =>
        b.day === s.day &&
        toMinutes(s.start) < toMinutes(b.end) + bufferMin &&
        toMinutes(b.start) - bufferMin < toMinutes(s.end),
    ),
  );
}

/** Aplica los filtros duros del asistente a las secciones de cada curso. */
export function diagnose(offer: EnrollmentOffer, prefs: StudentPreferences): CourseDiagnosis[] {
  const busy = prefs.works ? prefs.busy : [];
  return offer.courses.map((course) => {
    const all = offer.sections.filter((s) => s.courseCode === course.code);
    const steps: [Filter, (s: Section) => boolean][] = [
      ["VACANTES", (s) => s.enrolled < s.capacity],
      ["TURNO", (s) => s.sessions.every((x) => prefs.bands.includes(bandOf(x.start)))],
      ["DIAS_LIBRES", (s) => s.sessions.every((x) => !prefs.freeDays.includes(x.day))],
      ["TRABAJO", (s) => !hitsBusy(s, busy, prefs.bufferMin)],
    ];
    let current = all;
    const passed = {} as Record<Filter, number>;
    let blockedBy: Filter | undefined;
    for (const [name, ok] of steps) {
      current = current.filter(ok);
      passed[name] = current.length;
      if (!current.length && !blockedBy) blockedBy = name;
    }
    return { course, total: all.length, passed, candidates: current, blockedBy };
  });
}

/** Días con clase y minutos muertos entre clases del mismo día. */
export function layoutOf(sections: Section[]): { days: Day[]; gapMinutes: number } {
  const byDay = new Map<Day, [number, number][]>();
  for (const s of sections)
    for (const x of s.sessions) byDay.set(x.day, [...(byDay.get(x.day) ?? []), [toMinutes(x.start), toMinutes(x.end)]]);
  let gapMinutes = 0;
  for (const list of byDay.values()) {
    list.sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < list.length; i++) gapMinutes += Math.max(0, list[i]![0] - list[i - 1]![1] - BREAK_MIN);
  }
  return { days: DAYS.filter((d) => byDay.has(d)), gapMinutes };
}

function comfortOf(days: number, gapMinutes: number): number {
  return 1 - 0.6 * Math.min(days / 6, 1) - 0.4 * Math.min(gapMinutes / 360, 1);
}

/** Clave para ordenar: [repetidos incluidos, cursos, prioridad, puntaje]. Mayor es mejor. */
type Key = [number, number, number, number];

function compare(a: Key, b: Key): number {
  for (let i = 0; i < 4; i++) if (Math.abs(a[i]! - b[i]!) > EPS) return a[i]! - b[i]!;
  return 0;
}

interface Leaf {
  key: Key;
  picks: Assignment[];
}

/**
 * Busca las mejores combinaciones curso → sección que respetan las preferencias.
 *
 * Búsqueda en profundidad con poda (branch and bound), una vez por cada conjunto de días
 * de clase: para cada curso prueba sus secciones (de mejor a peor docente) o saltarlo, y
 * descarta ramas que ya no pueden superar a las peores opciones guardadas. Al final, una
 * mejora local cambia secciones sueltas si eso sube el puntaje. Prioriza, en este orden:
 * 1. incluir los cursos repetidos, 2. llevar más cursos, 3. obligatorios antes que electivos,
 * 4. el puntaje que mezcla calidad docente y comodidad según `professorWeight`.
 */
export function generate(input: GenerateInput): GenerateResult {
  const { offer, stats, prefs, maxCredits } = input;
  const limit = input.limit ?? 3;
  const maxNodes = input.maxNodes ?? 200_000;
  const w = prefs.professorWeight;

  const diagnosis = diagnose(offer, prefs);
  const budgetCredits = prefs.budgetPen == null ? Infinity : prefs.budgetPen / prefs.costPerCreditPen;
  const creditCap = Math.min(maxCredits, budgetCredits);

  const qualityOf = (s: Section) => {
    const st = s.professorId ? stats.get(s.professorId) : undefined;
    return st ? { quality: (st.score - 1) / 4, professorScore: st.overall } : { quality: 0.5, professorScore: undefined };
  };

  // Cursos con al menos una sección posible: los prioritarios primero y, a igual prioridad, los más difíciles de ubicar.
  const nodes = diagnosis
    .filter((d) => d.candidates.length)
    .map((d) => ({
      course: d.course,
      prio: priorityOf(d.course),
      options: dedupe(d.candidates.map((section) => ({ course: d.course, section, ...qualityOf(section) }))),
    }))
    .sort((a, b) => b.prio - a.prio || a.options.length - b.options.length);

  const maxCourses = prefs.maxCourses;
  const POOL = 24;
  const pool: Leaf[] = [];
  let explored = 0;
  let complete = true;

  const keyOf = (picks: Assignment[]): Key => {
    const { days, gapMinutes } = layoutOf(picks.map((p) => p.section));
    const comfort = comfortOf(days.length, gapMinutes);
    const quality = picks.reduce((a, p) => a + p.quality, 0) / picks.length;
    const total = w * quality + (1 - w) * comfort + TIEBREAK * comfort;
    const rep = picks.filter((p) => p.course.repeated).length;
    const prio = picks.reduce((a, p) => a + priorityOf(p.course), 0);
    return [rep, picks.length, prio, total];
  };

  const signature = (picks: Assignment[]) => picks.map((p) => p.section.code).sort().join();
  const insert = (leaf: Leaf) => {
    if (pool.length === POOL && compare(leaf.key, pool[POOL - 1]!.key) <= 0) return;
    const sig = signature(leaf.picks);
    if (pool.some((l) => signature(l.picks) === sig)) return;
    const at = pool.findIndex((l) => compare(leaf.key, l.key) > 0);
    pool.splice(at === -1 ? pool.length : at, 0, leaf);
    if (pool.length > POOL) pool.pop();
  };

  /**
   * Busca solo horarios que usan exactamente los días `days`. Así la comodidad máxima
   * de la rama se conoce de antemano y la poda corta mucho más.
   */
  const search = (list: typeof nodes, days: Day[]) => {
    const n = list.length;
    const comfortUb = comfortOf(days.length, 0);
    const suffixRepeated = Array.from({ length: n + 1 }, (_, i) => list.slice(i).filter((x) => x.course.repeated).length);
    const taken: Assignment[] = [];

    const record = () => {
      if (taken.length && layoutOf(taken.map((p) => p.section)).days.length === days.length)
        insert({ key: keyOf(taken), picks: [...taken] });
    };

    const bound = (i: number, rep: number, prio: number, sumQ: number, credits: number): Key => {
      const slots = Math.min(n - i, maxCourses - taken.length);
      // Mejor sección de cada curso restante que todavía no choca con lo ya tomado.
      const rest = list
        .slice(i)
        .filter((x) => credits + x.course.credits <= creditCap + EPS)
        .flatMap((x) => {
          const free = x.options.find((o) => !taken.some((t) => sessionsClash(t.section.sessions, o.section.sessions)));
          return free ? [{ x, q: free.quality }] : [];
        });
      const usable = Math.min(slots, rest.length);
      const count = taken.length + usable;
      const prioUb = prio + rest.map(({ x }) => x.prio).sort((a, b) => b - a).slice(0, usable).reduce((a, b) => a + b, 0);
      const qUb = sumQ + rest.map(({ q }) => q).sort((a, b) => b - a).slice(0, usable).reduce((a, b) => a + b, 0);
      const totalUb = count ? w * (qUb / count) + (1 - w) * comfortUb + TIEBREAK * comfortUb : 1 + TIEBREAK;
      return [rep + suffixRepeated[i]!, count, prioUb, totalUb];
    };

    const dfs = (i: number, rep: number, prio: number, sumQ: number, credits: number) => {
      if (++explored > maxNodes) {
        complete = false;
        return;
      }
      if (i === n || taken.length === maxCourses) return record();
      if (pool.length === POOL && compare(bound(i, rep, prio, sumQ, credits), pool[POOL - 1]!.key) <= 0) return;

      const node = list[i]!;
      if (credits + node.course.credits <= creditCap + EPS) {
        for (const opt of node.options) {
          if (taken.some((t) => sessionsClash(t.section.sessions, opt.section.sessions))) continue;
          taken.push(opt);
          dfs(i + 1, rep + (node.course.repeated ? 1 : 0), prio + node.prio, sumQ + opt.quality, credits + node.course.credits);
          taken.pop();
          if (!complete) return;
        }
      }
      dfs(i + 1, rep, prio, sumQ, credits); // saltar este curso
    };
    dfs(0, 0, 0, 0, 0);
  };

  // Todos los conjuntos de días posibles, de menos a más días (los cómodos llenan el pozo primero).
  const usedDays = DAYS.filter((d) => nodes.some((x) => x.options.some((o) => o.section.sessions.some((s) => s.day === d))));
  const daySets: Day[][] = [];
  for (let mask = 1; mask < 1 << usedDays.length; mask++) daySets.push(usedDays.filter((_, k) => mask & (1 << k)));
  daySets.sort((a, b) => a.length - b.length);
  for (const days of daySets) {
    if (!complete) break;
    const list = nodes
      .map((x) => ({ ...x, options: x.options.filter((o) => o.section.sessions.every((s) => days.includes(s.day))) }))
      .filter((x) => x.options.length);
    const covered = new Set(list.flatMap((x) => x.options.flatMap((o) => o.section.sessions.map((s) => s.day))));
    if (covered.size === days.length) search(list, days);
  }

  // Mejora local: cambia una sección (o un curso por otro) mientras el puntaje suba.
  // Corrige lo que la búsqueda no alcanzó a ver cuando se cortó por `maxNodes`.
  const fits = (picks: Assignment[], o: Assignment) =>
    picks.every((t) => !sessionsClash(t.section.sessions, o.section.sessions)) &&
    picks.reduce((a, p) => a + p.course.credits, 0) + o.course.credits <= creditCap + EPS;
  for (const start of [...pool]) {
    let current = start;
    for (let round = 0; round < 40; round++) {
      let best = current;
      for (let j = 0; j < current.picks.length; j++) {
        const others = current.picks.filter((_, k) => k !== j);
        const inUse = new Set(others.map((p) => p.course.code));
        for (const node of nodes) {
          if (inUse.has(node.course.code)) continue;
          for (const o of node.options) {
            if (!fits(others, o)) continue;
            const picks = [...others, o];
            const key = keyOf(picks);
            if (compare(key, best.key) > 0) best = { key, picks };
          }
        }
      }
      if (best === current) break;
      current = best;
      insert(current);
    }
  }

  const options = pickDiverse(pool, limit).map((leaf) => toOption(leaf, w, prefs));
  const best = options[0];

  const left = diagnosis
    .filter((d) => !best?.picks.some((p) => p.course.code === d.course.code))
    .map((d) => ({ course: d.course, reason: whyLeft(d, best, prefs, maxCredits, creditCap) }));

  return { options, diagnosis, left, tips: tipsFor(diagnosis, prefs, best), creditCap, explored, complete };
}

/** Entre secciones con el mismo horario, deja la de mejor docente. Ordena de mejor a peor. */
function dedupe(options: Assignment[]): Assignment[] {
  const bySlot = new Map<string, Assignment>();
  for (const o of options) {
    const slot = o.section.sessions.map((x) => `${x.day}${x.start}${x.end}`).sort().join();
    const prev = bySlot.get(slot);
    if (!prev || o.quality > prev.quality) bySlot.set(slot, o);
  }
  return [...bySlot.values()].sort((a, b) => b.quality - a.quality);
}

/** Toma las mejores, pero exige que cada nueva opción cambie al menos 2 secciones respecto de las ya elegidas. */
function pickDiverse(pool: Leaf[], limit: number): Leaf[] {
  const out: Leaf[] = [];
  const codes = (l: Leaf) => new Set(l.picks.map((p) => p.section.code));
  for (const minDiff of [2, 1]) {
    for (const leaf of pool) {
      if (out.length >= limit) break;
      if (out.includes(leaf)) continue;
      const mine = codes(leaf);
      const differs = out.every((o) => {
        const theirs = codes(o);
        const diff = [...mine].filter((c) => !theirs.has(c)).length + [...theirs].filter((c) => !mine.has(c)).length;
        return diff / 2 >= minDiff;
      });
      if (differs) out.push(leaf);
    }
  }
  return out;
}

function toOption(leaf: Leaf, w: number, prefs: StudentPreferences): ScheduleOption {
  const picks = [...leaf.picks].sort((a, b) => a.course.name.localeCompare(b.course.name));
  const credits = round2(picks.reduce((a, p) => a + p.course.credits, 0));
  const { days, gapMinutes } = layoutOf(picks.map((p) => p.section));
  const quality = picks.reduce((a, p) => a + p.quality, 0) / picks.length;
  const comfort = comfortOf(days.length, gapMinutes);
  const option: ScheduleOption = {
    picks,
    credits,
    costPen: round2(credits * prefs.costPerCreditPen),
    quality,
    comfort,
    total: w * quality + (1 - w) * comfort,
    days,
    gapMinutes,
    highlights: [],
  };
  option.highlights = explain(option, prefs);
  return option;
}

/** Frases cortas que explican por qué esta opción es buena. */
export function explain(o: ScheduleOption, prefs: StudentPreferences): string[] {
  const out: string[] = [];
  const scored = o.picks.filter((p) => p.professorScore != null);
  if (scored.length) {
    const avg = scored.reduce((a, p) => a + p.professorScore!, 0) / scored.length;
    const top = scored.reduce((a, b) => (b.professorScore! > a.professorScore! ? b : a));
    out.push(`Docentes con nota promedio ${avg.toFixed(1)}★; la mejor es ${top.section.professorName} (${top.professorScore!.toFixed(1)}★).`);
  }
  out.push(`Vas ${o.days.length} ${o.days.length === 1 ? "día" : "días"}: ${o.days.map((d) => DAY_SHORT[d]).join(", ")}.`);
  out.push(
    o.gapMinutes === 0
      ? "Sin horas muertas entre clases."
      : `${(o.gapMinutes / 60).toFixed(1).replace(".0", "")} h libres entre clases en la semana.`,
  );
  if (prefs.works && prefs.busy.length)
    out.push(
      `Ninguna clase choca con tu trabajo${prefs.bufferMin ? ` y tienes ${prefs.bufferMin} min para llegar` : ""}.`,
    );
  if (prefs.budgetPen != null) out.push(`Cuesta S/ ${o.costPen.toFixed(2)} de tu presupuesto de S/ ${prefs.budgetPen}.`);
  return out;
}

function whyLeft(
  d: CourseDiagnosis,
  best: ScheduleOption | undefined,
  prefs: StudentPreferences,
  maxCredits: number,
  creditCap: number,
): string {
  switch (d.blockedBy) {
    case "VACANTES":
      return "Ninguna sección tiene vacantes.";
    case "TURNO":
      return `Ninguna sección cae en tu turno (${prefs.bands.map((b) => BAND_LABEL[b]).join(", ")}).`;
    case "DIAS_LIBRES":
      return `Sus secciones caen en tus días libres (${prefs.freeDays.map((x) => DAY_LABEL[x]).join(", ")}).`;
    case "TRABAJO":
      return "Todas sus secciones chocan con tu horario de trabajo.";
  }
  const credits = best?.credits ?? 0;
  if (best && best.picks.length >= prefs.maxCourses) return `Ya llegaste a tu máximo de ${prefs.maxCourses} cursos.`;
  if (credits + d.course.credits > creditCap + EPS)
    return creditCap < maxCredits
      ? `No alcanza tu presupuesto de S/ ${prefs.budgetPen} (S/ ${prefs.costPerCreditPen} por crédito).`
      : `Pasaría el límite de ${maxCredits} créditos.`;
  return "Todas sus secciones posibles se cruzan con los cursos elegidos.";
}

function tipsFor(diagnosis: CourseDiagnosis[], prefs: StudentPreferences, best: ScheduleOption | undefined): string[] {
  const tips: string[] = [];
  const blocked = (f: Filter) => diagnosis.filter((d) => d.blockedBy === f).length;

  if (blocked("TURNO")) {
    const missing = (["MANANA", "TARDE", "NOCHE"] as TimeBand[]).filter((b) => !prefs.bands.includes(b));
    tips.push(
      `Tu turno deja fuera ${blocked("TURNO")} ${blocked("TURNO") === 1 ? "curso" : "cursos"}. Prueba agregar ${missing
        .map((b) => BAND_LABEL[b])
        .join(" o ")}.`,
    );
  }
  if (blocked("TRABAJO"))
    tips.push(
      `Tu horario de trabajo deja fuera ${blocked("TRABAJO")} ${blocked("TRABAJO") === 1 ? "curso" : "cursos"}.${
        prefs.bufferMin ? " Prueba con menos minutos para llegar." : ""
      }`,
    );
  if (blocked("DIAS_LIBRES")) tips.push(`Tus días libres dejan fuera ${blocked("DIAS_LIBRES")} cursos.`);
  if (!best) tips.push("Ninguna combinación cumple todo. Afloja el turno, el trabajo o el presupuesto.");
  return tips;
}
