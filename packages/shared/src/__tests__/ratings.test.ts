import { describe, expect, it } from "vitest";
import { professorStats, type Review } from "../index";

const rv = (professorId: string, s: number, rec = true): Review => ({
  id: Math.random().toString(36),
  professorId,
  courseCode: "X",
  term: "2026-1",
  clarity: s,
  rigor: 3,
  punctuality: s,
  treatment: s,
  wouldRecommend: rec,
  comment: "",
  tags: s >= 4 ? ["Explica bien"] : ["Poco puntual"],
  createdAt: "2026-01-01T00:00:00.000Z",
  demo: true,
});

describe("professorStats", () => {
  it("promedia criterios y % de recomendación", () => {
    const s = professorStats([rv("a", 5), rv("a", 3, false)]).get("a")!;
    expect(s.count).toBe(2);
    expect(s.overall).toBe(4);
    expect(s.recommendPct).toBe(50);
    expect(s.topTags).toEqual(["Explica bien", "Poco puntual"]);
  });

  it("una sola reseña perfecta no supera a muchas reseñas muy buenas", () => {
    const many = Array.from({ length: 30 }, () => rv("b", 5)).map((r, i) => (i % 4 === 0 ? { ...r, clarity: 4 } : r));
    const stats = professorStats([rv("a", 5), ...many, rv("c", 2), rv("c", 2)]);
    expect(stats.get("b")!.score).toBeGreaterThan(stats.get("a")!.score);
  });
});
