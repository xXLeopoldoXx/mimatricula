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
      <div className="mx-auto max-w-xl rounded-xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold">Tu horario está vacío</h1>
        <p className="mt-1 text-sm text-utp-muted">Elige secciones en Cursos o deja que Recomendaciones te sugiera las mejores.</p>
        <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
          <Link to="/cursos" className="rounded-md bg-utp-violet px-4 py-2 text-sm font-bold text-white hover:bg-utp-violet-dark">
            Ir a Cursos
          </Link>
          <Link to="/recomendaciones" className="rounded-md border border-utp-violet px-4 py-2 text-sm font-bold text-utp-violet">
            Ver recomendaciones
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mi horario</h1>
          <p className="mt-1 text-sm text-utp-muted">
            {chosen.length} cursos · {credits} créditos · {hours} horas semanales
          </p>
        </div>
        <button onClick={clear} className="text-sm text-utp-red underline">
          Vaciar horario
        </button>
      </div>

      {clashing.length > 0 && (
        <div role="alert" className="flex gap-2 rounded-lg border border-utp-red/30 bg-utp-red/10 px-4 py-3 text-sm text-utp-red-dark">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <span>
            Tienes cruces entre: <b>{clashing.map((c) => c.course.name).join(", ")}</b>. Cambia una de las secciones en Cursos.
          </span>
        </div>
      )}
      {credits > MAX_CREDITS && (
        <div role="alert" className="rounded-lg border border-utp-red/30 bg-utp-red/10 px-4 py-3 text-sm text-utp-red-dark">
          Superas el máximo de {MAX_CREDITS} créditos.
        </div>
      )}

      <section className="rounded-xl bg-white p-4 shadow-sm md:p-6">
        <WeekGrid chosen={chosen} />
      </section>

      <section className="rounded-xl bg-white shadow-sm">
        <h2 className="border-b border-utp-line px-4 py-3 font-bold">Cursos elegidos</h2>
        <ul className="divide-y divide-utp-line">
          {chosen.map((c, i) => (
            <li key={c.course.code} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
              <span className={`h-8 w-1.5 rounded-full border-l-4 ${COURSE_COLORS[i % COURSE_COLORS.length]}`} />
              <div className="min-w-0 flex-1">
                <div className="font-bold">
                  {c.course.name} <span className="font-normal text-utp-muted">· Secc. {c.section.code}</span>
                </div>
                <div className="text-xs text-utp-muted">{c.section.sessions.map(formatSession).join(" · ")}</div>
              </div>
              <div className="text-sm">
                {c.section.professorId ? (
                  <Link to={`/profesores/${c.section.professorId}`} className="font-bold hover:underline">
                    {c.section.professorName}
                  </Link>
                ) : (
                  "Docente por asignar"
                )}
                <div>
                  <ScoreBadge stats={stats.get(c.section.professorId ?? "")} compact />
                </div>
              </div>
              <div className="flex gap-2">
                <Link to={`/cursos#${c.course.code}`} className="rounded-md border border-utp-line px-3 py-1.5 text-xs hover:bg-utp-bg">
                  Cambiar
                </Link>
                <button
                  onClick={() => remove(c.course.code)}
                  className="rounded-md border border-utp-red/40 px-2 py-1.5 text-utp-red hover:bg-utp-red/10"
                  aria-label={`Quitar ${c.course.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
