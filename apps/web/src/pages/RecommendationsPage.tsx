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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Recomendaciones</h1>
          <p className="page-lead">Para cada curso, las secciones con los docentes mejor evaluados por otros estudiantes.</p>
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

      <div className="bg-utp-night hourlines mt-6 flex flex-col gap-5 rounded-3xl p-6 text-white sm:flex-row sm:items-center sm:justify-between md:p-8">
        <div className="max-w-xl">
          <h2 className="font-display text-2xl font-bold">Arma tu horario con los mejores docentes</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-white/70">
            Elegimos la mejor sección de cada curso, sin cruces y hasta {MAX_CREDITS} créditos, con los repetidos primero. Esto reemplaza tu selección actual.
          </p>
        </div>
        <button onClick={applyBest} className="btn btn-accent shrink-0 px-5 py-3">
          <Sparkles size={17} /> Aplicar recomendación
        </button>
      </div>
      {result && (
        <p role="status" className="bg-utp-mint-soft text-utp-mint mt-4 rounded-2xl px-5 py-3.5 text-sm leading-relaxed">
          {result}{" "}
          <Link to="/horario" className="font-bold underline">
            Ver mi horario
          </Link>
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-5">
        {courses.map((c) => {
          const top = ranked(catalog, stats, c.code, shift).slice(0, 3);
          return (
            <li key={c.code} className="card overflow-hidden">
              <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4">
                <h3 className="text-lg font-semibold">
                  <span className="text-utp-muted font-medium">{c.code}</span> {c.name}
                </h3>
                <span className="text-utp-muted text-[13px]">
                  {c.credits} créditos, ciclo {c.cycle}
                </span>
              </div>
              <ul className="divide-utp-line border-utp-line divide-y border-t">
                {top.length === 0 && <li className="text-utp-muted px-5 py-5 text-sm">Sin secciones con vacantes en este turno.</li>}
                {top.map((s, i) => (
                  <SectionRow key={s.code} course={c} section={s} chosen={chosen} stats={stats.get(s.professorId ?? "")} highlight={i === 0 ? "Mejor opción" : undefined} />
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
