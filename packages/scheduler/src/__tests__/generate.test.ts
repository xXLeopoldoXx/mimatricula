import { describe, expect, it } from "vitest";
import { bandOf, professorStats, sessionsClash, toMinutes, type StudentPreferences } from "@mimatricula/shared";
import { DEMO_OFFER, DEMO_REVIEWS } from "@mimatricula/demo-data";
import { generate, layoutOf } from "../generate";

const stats = professorStats(DEMO_REVIEWS);
const base: StudentPreferences = {
  bands: ["MANANA", "TARDE", "NOCHE"],
  works: false,
  busy: [],
  bufferMin: 0,
  maxCourses: 7,
  budgetPen: null,
  costPerCreditPen: 50,
  professorWeight: 0.7,
  freeDays: [],
};
const run = (p: Partial<StudentPreferences>) => generate({ offer: DEMO_OFFER, stats, prefs: { ...base, ...p }, maxCredits: 22 });

function noClashes(sections: { sessions: { day: string; start: string; end: string }[] }[]) {
  for (let i = 0; i < sections.length; i++)
    for (let j = i + 1; j < sections.length; j++) expect(sessionsClash(sections[i]!.sessions as never, sections[j]!.sessions as never)).toBe(false);
}

describe("generate", () => {
  it("devuelve 3 opciones distintas, sin cruces y dentro de los límites", () => {
    const r = run({});
    expect(r.options).toHaveLength(3);
    for (const o of r.options) {
      expect(o.picks.length).toBeLessThanOrEqual(7);
      expect(o.credits).toBeLessThanOrEqual(22);
      noClashes(o.picks.map((p) => p.section));
      expect(o.picks.every((p) => p.section.enrolled < p.section.capacity)).toBe(true);
    }
    const codes = r.options.map((o) => o.picks.map((p) => p.section.code).sort().join());
    expect(new Set(codes).size).toBe(3);
  });

  it("incluye primero el curso repetido", () => {
    const r = run({ maxCourses: 3 });
    expect(r.options[0]!.picks.some((p) => p.course.repeated)).toBe(true);
  });

  it("respeta el turno elegido", () => {
    const r = run({ bands: ["NOCHE"] });
    for (const o of r.options) for (const p of o.picks) for (const s of p.section.sessions) expect(bandOf(s.start)).toBe("NOCHE");
  });

  it("no choca con el trabajo ni con el margen para llegar", () => {
    const busy = (["LUN", "MAR", "MIE", "JUE", "VIE"] as const).map((day) => ({ day, start: "08:00", end: "17:00", label: "Trabajo" }));
    const r = run({ works: true, busy, bufferMin: 60 });
    expect(r.options.length).toBeGreaterThan(0);
    for (const o of r.options)
      for (const p of o.picks)
        for (const s of p.section.sessions)
          if (s.day !== "SAB") expect(toMinutes(s.start)).toBeGreaterThanOrEqual(18 * 60);
  });

  it("no pasa el presupuesto y explica qué quedó fuera", () => {
    const r = run({ budgetPen: 300, costPerCreditPen: 50 });
    for (const o of r.options) expect(o.costPen).toBeLessThanOrEqual(300);
    expect(r.left.some((l) => l.reason.includes("presupuesto"))).toBe(true);
  });

  it("sin días libres usados y con la comodidad como prioridad, usa pocos días", () => {
    const r = run({ freeDays: ["SAB", "LUN"], professorWeight: 0, maxCourses: 4 });
    for (const o of r.options) for (const p of o.picks) expect(p.section.sessions.some((s) => s.day === "SAB" || s.day === "LUN")).toBe(false);
    const quality = run({ freeDays: ["SAB", "LUN"], professorWeight: 1, maxCourses: 4 });
    expect(r.options[0]!.days.length).toBeLessThanOrEqual(quality.options[0]!.days.length);
    expect(quality.options[0]!.quality).toBeGreaterThanOrEqual(r.options[0]!.quality);
  });

  it("dice qué bloquea cuando nada es posible", () => {
    const r = run({ budgetPen: 5 });
    expect(r.options).toHaveLength(0);
    expect(r.tips.length).toBeGreaterThan(0);
  });

  it("cuenta las horas muertas sin los recreos de 15 minutos", () => {
    const s = (start: string, end: string) => ({ sessions: [{ day: "LUN" as const, start, end }] }) as never;
    expect(layoutOf([s("08:30", "10:00"), s("10:15", "11:45")]).gapMinutes).toBe(0);
    expect(layoutOf([s("08:30", "10:00"), s("12:00", "13:30")]).gapMinutes).toBe(105);
  });

  it("termina rápido con la oferta completa", () => {
    const t = performance.now();
    const r = run({ maxCourses: 8 });
    expect(performance.now() - t).toBeLessThan(3000);
    expect(r.options.length).toBe(3);
  });
});
