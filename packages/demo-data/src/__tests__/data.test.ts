import { describe, expect, it } from "vitest";
import { courseKey, EnrollmentOfferSchema, professorKey, ReviewSchema } from "@mimatricula/shared";
import { DEMO_OFFER, DEMO_REVIEWS } from "../index";

describe("datos de demo", () => {
  it("la oferta cumple el contrato", () => {
    const r = EnrollmentOfferSchema.safeParse(DEMO_OFFER);
    if (!r.success) console.error(r.error.issues.slice(0, 5));
    expect(r.success).toBe(true);
  });

  it("cada sección apunta a un curso y docente existentes", () => {
    const courses = new Set(DEMO_OFFER.courses.map((c) => c.code));
    const profs = new Set(DEMO_OFFER.professors.map((p) => p.id));
    for (const s of DEMO_OFFER.sections) {
      expect(courses.has(s.courseCode)).toBe(true);
      expect(s.professorId && profs.has(s.professorId)).toBe(true);
    }
  });

  it("las reseñas son válidas, de demo y de docentes existentes", () => {
    const profs = new Set(DEMO_OFFER.professors.map((p) => p.id));
    expect(DEMO_REVIEWS.length).toBeGreaterThanOrEqual(100);
    for (const rv of DEMO_REVIEWS) {
      expect(ReviewSchema.safeParse(rv).success).toBe(true);
      expect(rv.demo).toBe(true);
      expect(profs.has(rv.professorId)).toBe(true);
    }
  });

  it("no repite cursos ni docentes (por nombre normalizado)", () => {
    const courseKeys = DEMO_OFFER.courses.map((c) => courseKey(c.name));
    expect(new Set(courseKeys).size).toBe(courseKeys.length);
    const profKeys = DEMO_OFFER.professors.map((p) => professorKey(p.name));
    expect(new Set(profKeys).size).toBe(profKeys.length);
  });

  it("cubre los ciclos 1 a 10 salvo el 7, que no vino en la lista", () => {
    const cycles = new Set(DEMO_OFFER.courses.map((c) => Number(c.cycle)));
    for (const n of [1, 2, 3, 4, 5, 6, 8, 9, 10]) expect(cycles.has(n)).toBe(true);
    expect(cycles.has(7)).toBe(false);
  });

  it("todo docente con secciones tiene reseñas y cada curso tiene secciones", () => {
    const reviewed = new Set(DEMO_REVIEWS.map((r) => r.professorId));
    for (const s of DEMO_OFFER.sections) expect(reviewed.has(s.professorId!)).toBe(true);
    for (const c of DEMO_OFFER.courses) expect(DEMO_OFFER.sections.some((s) => s.courseCode === c.code)).toBe(true);
  });
});
