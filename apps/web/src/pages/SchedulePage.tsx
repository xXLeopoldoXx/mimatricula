import { Link } from "react-router";
import { AlertTriangle, Trash2 } from "lucide-react";
import { formatSession } from "@mimatricula/shared";
import { clashWith, round2, useCatalog, useChosen, useProfessorStats, MAX_CREDITS } from "../lib/catalog";
import { useSelection } from "../store/selection";
import NoOffer from "../components/NoOffer";
import ScoreBadge from "../components/ScoreBadge";
import WeekGrid, { COURSE_COLORS } from "../components/WeekGrid";

export default function SchedulePage() {
  const catalog = useCatalog();
  const chosen = useChosen(catalog);
  const stats = useProfessorStats();
  const { remove, clear } = useSelection();

  if (!catalog) return <NoOffer />;

  const credits = round2(chosen.reduce((a, c) => a + c.course.credits, 0));
  const hours = round2(chosen.reduce((a, c) => a + c.course.weeklyHours, 0));
  const clashing = chosen.filter((c) => clashWith(c.section, chosen, c.course.code));

  if (chosen.length === 0) {
    return (
      <div className="card mx-auto max-w-xl p-10 text-center">
        <h1 className="text-2xl font-bold">Tu horario está vacío</h1>
        <p className="text-utp-muted mt-2 text-[15px]">Elige secciones en Cursos o deja que Recomendaciones te sugiera las mejores.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/cursos" className="btn btn-primary">
            Ir a Cursos
          </Link>
          <Link to="/recomendaciones" className="btn btn-outline">
            Ver recomendaciones
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Mi horario</h1>
          <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
            {[
              [`${chosen.length}`, chosen.length === 1 ? "curso" : "cursos"],
              [`${credits}`, "créditos"],
              [`${hours}`, "horas por semana"],
            ].map(([v, l]) => (
              <div key={l} className="flex items-baseline gap-1.5">
                <dt className="font-display text-2xl font-bold tabular-nums">{v}</dt>
                <dd className="text-utp-muted text-sm">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
        <button onClick={clear} className="btn btn-outline text-utp-red hover:border-utp-red/40 hover:bg-utp-red/5">
          <Trash2 size={16} /> Vaciar horario
        </button>
      </div>

      {clashing.length > 0 && (
        <div role="alert" className="border-utp-red/25 bg-utp-red/8 text-utp-red-dark flex gap-3 rounded-2xl border px-5 py-4 text-sm">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <span>
            Tienes cruces entre: <b>{clashing.map((c) => c.course.name).join(", ")}</b>. Cambia una de las secciones en Cursos.
          </span>
        </div>
      )}
      {credits > MAX_CREDITS && (
        <div role="alert" className="border-utp-red/25 bg-utp-red/8 text-utp-red-dark rounded-2xl border px-5 py-4 text-sm font-medium">
          Superas el máximo de {MAX_CREDITS} créditos.
        </div>
      )}

      <section className="card p-4 md:p-6">
        <WeekGrid chosen={chosen} />
      </section>

      <section className="card overflow-hidden">
        <h2 className="border-utp-line border-b px-5 py-4 text-lg font-bold">Cursos elegidos</h2>
        <ul className="divide-utp-line divide-y">
          {chosen.map((c, i) => (
            <li key={c.course.code} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4">
              <span className={`h-10 w-1.5 rounded-full border-l-4 ${COURSE_COLORS[i % COURSE_COLORS.length]}`} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">
                  {c.course.name} <span className="text-utp-muted font-normal">Sección {c.section.code}</span>
                </div>
                <div className="text-utp-muted mt-0.5 text-[13px]">{c.section.sessions.map(formatSession).join(" y ")}</div>
              </div>
              <div className="text-sm">
                {c.section.professorId ? (
                  <Link to={`/profesores/${c.section.professorId}`} className="font-semibold hover:underline">
                    {c.section.professorName}
                  </Link>
                ) : (
                  "Docente por asignar"
                )}
                <div className="mt-1">
                  <ScoreBadge stats={stats.get(c.section.professorId ?? "")} compact />
                </div>
              </div>
              <div className="flex gap-2">
                <Link to={`/cursos#${c.course.code}`} className="btn btn-outline px-3 py-2 text-xs">
                  Cambiar
                </Link>
                <button
                  onClick={() => remove(c.course.code)}
                  className="border-utp-red/30 text-utp-red hover:bg-utp-red/8 rounded-xl border px-2.5 py-2"
                  aria-label={`Quitar ${c.course.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
