import { useEffect, useMemo } from "react";
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
import { DEMO_OFFER, DEMO_REVIEWS } from "@mimatricula/demo-data";
import { resolveOffer } from "./directory";
import { communityId, useCommunityProfessors } from "../store/professors";
import { useCycle } from "../store/cycle";
import { useOfferStore } from "../store/offer";
import { useMyReviews } from "../store/reviews";
import { useSelection } from "../store/selection";

export interface Catalog {
  /** Oferta del ciclo elegido (cursos repetidos siempre incluidos): lo que ven listas, recomendaciones y generador. */
  offer: EnrollmentOffer;
  /** Oferta completa con docentes emparejados, de todos los ciclos. */
  fullOffer: EnrollmentOffer;
  /** Ciclos presentes en la oferta, ordenados. */
  cycles: string[];
  /** Ciclo en uso: "01", "02"... o "TODOS". */
  cycle: string;
  courseByCode: Map<string, Course>;
  sectionByCode: Map<string, Section>;
  sectionsByCourse: Map<string, Section[]>;
  professorById: Map<string, Professor>;
}

/** Con ofertas grandes (varios ciclos) arranca en el ciclo más bajo para no mezclar cursos de ciclos distintos. */
function autoCycle(courses: Course[], cycles: string[]): string {
  if (courses.length <= 14) return "TODOS";
  return cycles.find((c) => Number(c) > 0) ?? "TODOS";
}

/** Índices de la oferta activa, o null si aún no se importó ninguna. */
export function useCatalog(): Catalog | null {
  const raw = useOfferStore((s) => s.imported?.offer ?? null);
  const community = useCommunityProfessors((s) => s.list);
  const selected = useCycle((s) => s.selected);
  return useMemo(() => {
    if (!raw) return null;
    const full = resolveOffer(raw, community).offer;
    const cycles = [...new Set(full.courses.map((c) => c.cycle))].sort();
    const wanted = selected && (selected === "TODOS" || cycles.includes(selected)) ? selected : autoCycle(full.courses, cycles);
    const courses = wanted === "TODOS" ? full.courses : full.courses.filter((c) => c.cycle === wanted || c.repeated);
    const codes = new Set(courses.map((c) => c.code));
    const sections = full.sections.filter((s) => codes.has(s.courseCode));
    const usedProfessors = new Set(sections.map((s) => s.professorId));
    const offer: EnrollmentOffer = { ...full, courses, sections, professors: full.professors.filter((p) => usedProfessors.has(p.id)) };

    const sectionsByCourse = new Map<string, Section[]>();
    for (const s of sections) sectionsByCourse.set(s.courseCode, [...(sectionsByCourse.get(s.courseCode) ?? []), s]);
    return {
      offer,
      fullOffer: full,
      cycles,
      cycle: wanted,
      courseByCode: new Map(full.courses.map((c) => [c.code, c])),
      sectionByCode: new Map(full.sections.map((s) => [s.code, s])),
      sectionsByCourse,
      professorById: new Map(full.professors.map((p) => [p.id, p])),
    };
  }, [raw, community, selected]);
}

/** Registra como docentes de la comunidad los de la oferta que aún no existían, para poder calificarlos. */
export function useRegisterOfferProfessors() {
  const raw = useOfferStore((s) => s.imported?.offer ?? null);
  const community = useCommunityProfessors((s) => s.list);
  const addMany = useCommunityProfessors((s) => s.addMany);
  useEffect(() => {
    if (!raw) return;
    const { unmatched } = resolveOffer(raw, community);
    if (!unmatched.length) return;
    const now = new Date().toISOString();
    const codes = new Map<string, Set<string>>();
    for (const s of raw.sections) {
      if (!s.professorName) continue;
      const id = communityId(s.professorName);
      codes.set(id, (codes.get(id) ?? new Set()).add(s.courseCode));
    }
    addMany(
      unmatched.map((p) => ({ ...p, courseCodes: [...(codes.get(p.id) ?? [])], createdAt: now, source: "oferta" as const })),
    );
  }, [raw, community, addMany]);
}

/** Directorio completo de docentes: demostración + comunidad + los de la oferta activa. */
export function useDirectory() {
  const catalog = useCatalog();
  const community = useCommunityProfessors((s) => s.list);
  return useMemo(() => {
    const professors = new Map<string, Professor>();
    for (const p of DEMO_OFFER.professors) professors.set(p.id, p);
    for (const p of community) professors.set(p.id, p);
    for (const p of catalog?.fullOffer.professors ?? []) professors.set(p.id, p);

    const courses = new Map<string, Course>();
    for (const c of DEMO_OFFER.courses) courses.set(c.code, c);
    for (const c of catalog?.fullOffer.courses ?? []) courses.set(c.code, c);

    const coursesByProf = new Map<string, Set<string>>();
    const add = (pid: string | undefined, code: string) => {
      if (!pid) return;
      if (!coursesByProf.has(pid)) coursesByProf.set(pid, new Set());
      coursesByProf.get(pid)!.add(code);
    };
    for (const s of DEMO_OFFER.sections) add(s.professorId, s.courseCode);
    for (const p of community) for (const c of p.courseCodes) add(p.id, c);
    for (const s of catalog?.fullOffer.sections ?? []) add(s.professorId, s.courseCode);
    return { professors, courses, coursesByProf };
  }, [catalog, community]);
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
    return catalog.fullOffer.courses.flatMap((course) => {
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
