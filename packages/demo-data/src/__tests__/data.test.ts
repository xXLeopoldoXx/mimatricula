import { describe, expect, it } from "vitest";
import { EnrollmentOfferSchema, ReviewSchema } from "@mimatricula/shared";
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
});
