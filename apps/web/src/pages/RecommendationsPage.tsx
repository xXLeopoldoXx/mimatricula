import { useState } from "react";
import { Link } from "react-router";
import { Sparkles } from "lucide-react";
import { sessionsClash, type ProfessorStats, type Section, type Shift } from "@mimatricula/shared";
import { round2, useCatalog, useChosen, useProfessorStats, MAX_CREDITS, type Catalog } from "../lib/catalog";
import { useSelection } from "../store/selection";
import NoOffer from "../components/NoOffer";
import SectionRow from "../components/SectionRow";
import { Segmented } from "./CoursesPage";

/** Secciones con vacantes, de mejor a peor docente (nota ajustada por cantidad de reseñas). */
function ranked(catalog: Catalog, stats: Map<string, ProfessorStats>, courseCode: string, shift: Shift | "TODOS"): Section[] {
  return (catalog.sectionsByCourse.get(courseCode) ?? [])
    .filter((s) => s.enrolled < s.capacity && (shift === "TODOS" || s.shift === shift))
    .sort((a, b) => (stats.get(b.professorId ?? "")?.score ?? 0) - (stats.get(a.professorId ?? "")?.score ?? 0));
}

export default function RecommendationsPage() {
  const catalog = useCatalog();
  const chosen = useChosen(catalog);
  const stats = useProfessorStats();
  const replaceAll = useSelection((s) => s.replaceAll);
  const [shift, setShift] = useState<Shift | "TODOS">("TODOS");
  const [result, setResult] = useState<string | null>(null);

  if (!catalog) return <NoOffer />;

  const courses = [...catalog.offer.courses].sort((a, b) => Number(b.repeated) - Number(a.repeated));

  /** Toma, curso por curso, la mejor sección que no choque con las ya tomadas. */
  const applyBest = () => {
    const picks: Record<string, string> = {};
    const taken: Section[] = [];
    const clashed: string[] = [];
    const overLimit: string[] = [];
    let credits = 0;
    for (const c of courses) {
      if (credits + c.credits > MAX_CREDITS) {
        overLimit.push(c.name);
        continue;
      }
      const best = ranked(catalog, stats, c.code, shift).find((s) => !taken.some((t) => sessionsClash(s.sessions, t.sessions)));
      if (best) {
        picks[c.code] = best.code;
        taken.push(best);
        credits += c.credits;
      } else clashed.push(c.name);
    }
    replaceAll(picks);
    const parts = [`Elegimos ${taken.length} cursos (${round2(credits)} créditos) sin cruces.`];
    if (overLimit.length) parts.push(`Por el límite de ${MAX_CREDITS} créditos quedaron fuera: ${overLimit.join(", ")}.`);
    if (clashed.length) parts.push(`No entraron sin cruce: ${clashed.join(", ")}.`);
    setResult(parts.join(" "));
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Recomendaciones</h1>
          <p className="mt-1 max-w-2xl text-sm text-utp-muted">
            Para cada curso, las secciones con los docentes mejor evaluados por otros estudiantes.
          </p>
        </div>
        <Segmented
          value={shift}
          onChange={setShift}
          options={[
            ["TODOS", "Todos"],
            ["MANANA", "Mañana"],
            ["NOCHE", "Noche"],
          ]}
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-xl bg-utp-navy p-4 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-bold">Armar mi horario con los mejores docentes</div>
          <div className="text-sm text-white/75">
            Elige la mejor sección de cada curso, sin cruces y hasta {MAX_CREDITS} créditos (repetidos primero). Reemplaza tu selección actual.
          </div>
        </div>
        <button
          onClick={applyBest}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-bold text-utp-navy hover:bg-utp-violet-soft"
        >
          <Sparkles size={16} /> Aplicar recomendación
        </button>
      </div>
      {result && (
        <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
          {result}{" "}
          <Link to="/horario" className="font-bold underline">
            Ver mi horario
          </Link>
        </p>
      )}

      <ul className="mt-4 flex flex-col gap-4">
        {courses.map((c) => {
          const top = ranked(catalog, stats, c.code, shift).slice(0, 3);
          return (
            <li key={c.code} className="overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="px-4 py-3">
                <div className="font-bold">
                  {c.code} · {c.name}
                </div>
                <div className="text-xs text-utp-muted">
                  {c.credits} créditos · ciclo {c.cycle}
                </div>
              </div>
              <ul className="divide-y divide-utp-line border-t border-utp-line">
                {top.length === 0 && <li className="px-4 py-4 text-sm text-utp-muted">Sin secciones con vacantes en este turno.</li>}
                {top.map((s, i) => (
                  <SectionRow
                    key={s.code}
                    course={c}
                    section={s}
                    chosen={chosen}
                    stats={stats.get(s.professorId ?? "")}
                    highlight={i === 0 ? "Mejor opción" : undefined}
                  />
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
