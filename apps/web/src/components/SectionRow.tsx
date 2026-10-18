import { Link } from "react-router";
import { Check } from "lucide-react";
import { formatSession, type Course, type ProfessorStats, type Section } from "@mimatricula/shared";
import { clashWith, type Chosen } from "../lib/catalog";
import { useSelection } from "../store/selection";
import ScoreBadge from "./ScoreBadge";

interface Props {
  course: Course;
  section: Section;
  chosen: Chosen[];
  stats?: ProfessorStats;
  /** Resalta la fila (p. ej. la mejor opción en Recomendaciones). */
  highlight?: string;
}

const MODALITY: Record<Section["modality"], string> = { PRESENCIAL: "Presencial", VIRTUAL: "Virtual", HIBRIDO: "Híbrido" };

/** Una sección con docente, nota, horario, vacantes, aviso de cruce y botón para elegirla. */
export default function SectionRow({ course, section: s, chosen, stats, highlight }: Props) {
  const picks = useSelection((st) => st.picks);
  const pick = useSelection((st) => st.pick);
  const isPicked = picks[course.code] === s.code;
  const clash = clashWith(s, chosen, course.code);
  const free = Math.max(0, s.capacity - s.enrolled);
  const full = free === 0;

  return (
    <li
      className={`grid gap-x-4 gap-y-2 px-4 py-3 sm:grid-cols-[70px_1fr_1.2fr_auto] sm:items-center ${
        isPicked ? "bg-utp-violet-soft/60" : highlight ? "bg-amber-50" : ""
      }`}
    >
      <div className="flex items-center gap-2 sm:block">
        <b>{s.code}</b>
        <span className="text-[11px] text-utp-muted sm:block">{s.shift === "NOCHE" ? "Noche" : "Mañana"}</span>
        {highlight && <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-amber-950 sm:mt-1 sm:inline-block">{highlight}</span>}
      </div>

      <div className="text-sm">
        {s.sessions.map((ss, i) => (
          <div key={i}>{formatSession(ss)}</div>
        ))}
        <div className="text-[11px] text-utp-muted">
          {MODALITY[s.modality]} · Vacantes {free}/{s.capacity}
        </div>
        {clash && <div className="text-xs font-bold text-utp-red">Se cruza con {clash.course.name}</div>}
      </div>

      <div className="min-w-0 text-sm">
        {s.professorId ? (
          <Link to={`/profesores/${s.professorId}`} className="block truncate font-bold hover:text-utp-violet hover:underline">
            {s.professorName}
          </Link>
        ) : (
          <span className="text-utp-muted">Docente por asignar</span>
        )}
        <ScoreBadge stats={stats} compact />
      </div>

      <div className="sm:text-right">
        <button
          disabled={isPicked || full || !!clash}
          onClick={() => pick(course.code, s.code)}
          className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-utp-violet px-3 py-1.5 text-xs font-bold text-utp-violet transition hover:bg-utp-violet-soft disabled:cursor-not-allowed disabled:border-utp-line disabled:text-utp-muted disabled:hover:bg-transparent sm:w-28"
          title={clash ? `Se cruza con ${clash.course.name}` : undefined}
        >
          {isPicked ? (
            <>
              <Check size={14} /> Elegida
            </>
          ) : full ? (
            "Sin vacantes"
          ) : clash ? (
            "Con cruce"
          ) : picks[course.code] ? (
            "Cambiar a esta"
          ) : (
            "Elegir"
          )}
        </button>
      </div>
    </li>
  );
}
