import type { Review } from "./schemas";

export interface ProfessorStats {
  professorId: string;
  count: number;
  clarity: number;
  rigor: number;
  punctuality: number;
  treatment: number;
  /** Promedio de claridad, puntualidad y trato (la exigencia no es "buena" ni "mala"). */
  overall: number;
  /** Nota ajustada por cantidad de reseñas: con pocas reseñas se acerca al promedio general. */
  score: number;
  /** % de reseñas que lo recomiendan (0–100). */
  recommendPct: number;
  /** Etiquetas más repetidas, de mayor a menor. */
  topTags: string[];
}

/** Peso del promedio general: equivale a "C reseñas imaginarias" con la nota media. */
const PRIOR_WEIGHT = 3;

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const round1 = (n: number) => Math.round(n * 10) / 10;

export function overallOf(r: Pick<Review, "clarity" | "punctuality" | "treatment">): number {
  return (r.clarity + r.punctuality + r.treatment) / 3;
}

/**
 * Calcula las estadísticas de cada docente a partir de sus reseñas.
 * `score` usa un promedio bayesiano para que un docente con 1 reseña de 5★
 * no supere a uno con 30 reseñas de 4.7★.
 */
export function professorStats(reviews: Review[]): Map<string, ProfessorStats> {
  const globalMean = avg(reviews.map(overallOf)) || 3;
  const byProf = new Map<string, Review[]>();
  for (const r of reviews) byProf.set(r.professorId, [...(byProf.get(r.professorId) ?? []), r]);

  const out = new Map<string, ProfessorStats>();
  for (const [professorId, rs] of byProf) {
    const n = rs.length;
    const overalls = rs.map(overallOf);
    const tagCount = new Map<string, number>();
    for (const r of rs) for (const t of r.tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
    out.set(professorId, {
      professorId,
      count: n,
      clarity: round1(avg(rs.map((r) => r.clarity))),
      rigor: round1(avg(rs.map((r) => r.rigor))),
      punctuality: round1(avg(rs.map((r) => r.punctuality))),
      treatment: round1(avg(rs.map((r) => r.treatment))),
      overall: round1(avg(overalls)),
      score: (PRIOR_WEIGHT * globalMean + overalls.reduce((a, b) => a + b, 0)) / (PRIOR_WEIGHT + n),
      recommendPct: Math.round((rs.filter((r) => r.wouldRecommend).length / n) * 100),
      topTags: [...tagCount.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t),
    });
  }
  return out;
}
