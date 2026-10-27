import { Link } from "react-router";
import { Check, Clock } from "lucide-react";
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
  const fill = s.capacity ? Math.min(100, (s.enrolled / s.capacity) * 100) : 100;
  const scarce = !full && free <= Math.max(3, s.capacity * 0.1);

  return (
    <li
      className={`relative grid gap-x-5 gap-y-3 px-5 py-4 sm:grid-cols-[84px_1.2fr_1fr_auto] sm:items-center ${
        isPicked ? "bg-utp-violet-soft/50" : highlight ? "bg-utp-amber-soft/60" : ""
      }`}
    >
      {isPicked && <span className="bg-utp-violet absolute inset-y-0 left-0 w-1" aria-hidden="true" />}

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:block">
        <b className="font-display text-lg">{s.code}</b>
        <span className="text-utp-muted text-xs sm:block">{s.shift === "NOCHE" ? "Turno noche" : "Turno mañana"}</span>
        {highlight && <span className="mt-1 inline-block rounded-md bg-amber-400 px-1.5 py-0.5 text-[11px] font-bold text-amber-950">{highlight}</span>}
      </div>

      <div className="text-sm">
        {s.sessions.map((ss, i) => (
          <div key={i} className="flex items-center gap-1.5 font-medium">
            <Clock size={13} className="text-utp-muted shrink-0" />
            {formatSession(ss)}
          </div>
        ))}
        <div className="text-utp-muted mt-1.5 flex items-center gap-2 text-xs">
          <span>{MODALITY[s.modality]}</span>
          <span className="bg-utp-line h-1 w-16 overflow-hidden rounded-full" title={`${s.enrolled} de ${s.capacity} cupos ocupados`}>
            <span className={`block h-full rounded-full ${full ? "bg-utp-red" : scarce ? "bg-utp-star" : "bg-utp-mint"}`} style={{ width: `${fill}%` }} />
          </span>
          <span className={full ? "text-utp-red font-semibold" : scarce ? "font-semibold text-amber-700" : ""}>{full ? "Sin vacantes" : `${free} de ${s.capacity} libres`}</span>
        </div>
        {clash && <div className="text-utp-red mt-1.5 text-xs font-semibold">Se cruza con {clash.course.name}</div>}
      </div>

      <div className="min-w-0 text-sm">
        {s.professorId ? (
          <Link to={`/profesores/${s.professorId}`} className="hover:text-utp-violet block truncate font-semibold hover:underline">
            {s.professorName}
          </Link>
        ) : (
          <span className="text-utp-muted">Docente por asignar</span>
        )}
        <div className="mt-1">
          <ScoreBadge stats={stats} compact />
        </div>
      </div>

      <div className="sm:text-right">
        <button
          disabled={isPicked || full || !!clash}
          onClick={() => pick(course.code, s.code)}
          className={`btn w-full px-3 py-2 text-xs sm:w-32 ${isPicked ? "bg-utp-violet text-white disabled:opacity-100" : "btn-outline text-utp-violet"}`}
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
            "Elegir sección"
          )}
        </button>
      </div>
    </li>
  );
}
