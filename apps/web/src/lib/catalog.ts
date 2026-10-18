import { useMemo } from "react";
import {
  professorStats,
  sessionsClash,
  type Course,
  type EnrollmentOffer,
  type Professor,
  type ProfessorStats,
  type Review,
  type Section,
} from "@mimatricula/shared";
import { DEMO_REVIEWS } from "@mimatricula/demo-data";
import { useOfferStore } from "../store/offer";
import { useMyReviews } from "../store/reviews";
import { useSelection } from "../store/selection";

export interface Catalog {
  offer: EnrollmentOffer;
  courseByCode: Map<string, Course>;
  sectionByCode: Map<string, Section>;
  sectionsByCourse: Map<string, Section[]>;
  professorById: Map<string, Professor>;
}

/** Índices de la oferta activa, o null si aún no se importó ninguna. */
export function useCatalog(): Catalog | null {
  const offer = useOfferStore((s) => s.imported?.offer ?? null);
  return useMemo(() => {
    if (!offer) return null;
    const sectionsByCourse = new Map<string, Section[]>();
    for (const s of offer.sections) sectionsByCourse.set(s.courseCode, [...(sectionsByCourse.get(s.courseCode) ?? []), s]);
    return {
      offer,
      courseByCode: new Map(offer.courses.map((c) => [c.code, c])),
      sectionByCode: new Map(offer.sections.map((s) => [s.code, s])),
      sectionsByCourse,
      professorById: new Map(offer.professors.map((p) => [p.id, p])),
    };
  }, [offer]);
}

/** Reseñas de demo + las escritas por el estudiante. */
export function useAllReviews(): Review[] {
  const mine = useMyReviews((s) => s.mine);
  return useMemo(() => [...mine, ...DEMO_REVIEWS], [mine]);
}

export function useProfessorStats(): Map<string, ProfessorStats> {
  const reviews = useAllReviews();
  return useMemo(() => professorStats(reviews), [reviews]);
}

export interface Chosen {
  course: Course;
  section: Section;
}

/** Cursos elegidos con su sección, en el orden de la oferta. */
export function useChosen(catalog: Catalog | null): Chosen[] {
  const picks = useSelection((s) => s.picks);
  return useMemo(() => {
    if (!catalog) return [];
    return catalog.offer.courses.flatMap((course) => {
      const section = picks[course.code] ? catalog.sectionByCode.get(picks[course.code]!) : undefined;
      return section ? [{ course, section }] : [];
    });
  }, [catalog, picks]);
}

/** Primer curso elegido (distinto de `courseCode`) que se cruza con `section`. */
export function clashWith(section: Section, chosen: Chosen[], courseCode: string): Chosen | undefined {
  return chosen.find((c) => c.course.code !== courseCode && sessionsClash(section.sessions, c.section.sessions));
}

export const MAX_CREDITS = 22;

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}
