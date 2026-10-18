import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  formatSession,
  sessionsClash,
  type Course,
  type EnrollmentOffer,
  type Section,
  type Shift,
} from "@mimatricula/shared";

interface Props {
  course: Course;
  offer: EnrollmentOffer;
  picks: Record<string, string>;
  onClose: () => void;
  onSelect: (s: Section) => void;
}

const TABS: { id: Shift; label: string }[] = [
  { id: "MANANA", label: "Mañana" },
  { id: "NOCHE", label: "Noche" },
];

const MODALITY: Record<Section["modality"], string> = {
  PRESENCIAL: "Presencial",
  VIRTUAL: "Virtual",
  HIBRIDO: "Híbrido",
};

export default function SectionsModal({ course, offer, picks, onClose, onSelect }: Props) {
  const [tab, setTab] = useState<Shift>("MANANA");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const sections = useMemo(
    () => offer.sections.filter((s) => s.courseCode === course.code && s.shift === tab),
    [offer, course, tab],
  );

  // Secciones ya elegidas en OTROS cursos, para avisar cruces
  const others = useMemo(() => {
    const byCode = new Map(offer.sections.map((s) => [s.code, s]));
    return Object.entries(picks)
      .filter(([cc]) => cc !== course.code)
      .map(([cc, sc]) => ({ course: offer.courses.find((c) => c.code === cc), section: byCode.get(sc) }))
      .filter((x): x is { course: Course; section: Section } => !!x.course && !!x.section);
  }, [offer, picks, course]);

  const current = picks[course.code];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sections-title"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-t-2xl bg-white sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
        data-mm="sections-modal"
        data-course-code={course.code}
      >
        <div className="relative px-5 pt-6 pb-3 text-center">
          <button onClick={onClose} className="absolute top-4 right-4 rounded p-1 hover:bg-utp-bg" aria-label="Cerrar">
            <X size={22} />
          </button>
          <h2 id="sections-title" className="text-lg font-bold">
            Secciones disponibles
          </h2>
          <p className="mt-1 text-sm text-utp-muted">
            Selecciona el horario de tu preferencia en las diferentes modalidades y turnos
          </p>
        </div>

        <div className="mx-5 rounded-lg border border-utp-line p-4">
          <div className="font-bold">
            {course.code} - {course.name}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-utp-muted sm:grid-cols-4">
            <span>Tipo: {course.type === "OBLIGATORIO" ? "Obligatorio" : "Electivo"}</span>
            <span>Horas semanales: {course.weeklyHours}</span>
            <span>Créditos: {course.credits}</span>
            <span>Ciclo: {course.cycle}</span>
          </div>
        </div>

        <div className="mx-5 mt-3 flex border-b border-utp-line" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 border-b-4 py-2.5 text-sm ${
                tab === t.id ? "border-utp-violet font-bold text-utp-violet" : "border-transparent text-utp-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3 pb-5">
          {sections.length === 0 ? (
            <p className="py-10 text-center text-sm text-utp-muted">No hay secciones en este turno.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-utp-head text-left text-[13px]">
                <tr>
                  <th className="px-2 py-2.5 font-normal">Sección</th>
                  <th className="px-2 py-2.5 font-normal">Horario</th>
                  <th className="hidden px-2 py-2.5 font-normal sm:table-cell">Docente</th>
                  <th className="hidden px-2 py-2.5 font-normal sm:table-cell">Modalidad</th>
                  <th className="px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {sections.map((s) => {
                  const clash = others.find((o) => sessionsClash(s.sessions, o.section.sessions));
                  const full = s.enrolled >= s.capacity;
                  const isCurrent = current === s.code;
                  return (
                    <tr
                      key={s.code}
                      className="border-t border-utp-line align-top"
                      data-mm="section"
                      data-section-code={s.code}
                      data-course-code={s.courseCode}
                      data-shift={s.shift}
                      data-modality={s.modality}
                      data-professor-id={s.professorId ?? ""}
                      data-professor-name={s.professorName ?? ""}
                      data-capacity={s.capacity}
                      data-enrolled={s.enrolled}
                      data-sessions={JSON.stringify(s.sessions)}
                    >
                      <td className="px-2 py-3 font-bold">{s.code}</td>
                      <td className="px-2 py-3">
                        {s.sessions.map((ss, i) => (
                          <div key={i}>{formatSession(ss)}</div>
                        ))}
                        {/* En móvil, docente y modalidad bajan a la misma celda */}
                        <div className="mt-1 text-xs text-utp-muted sm:hidden">
                          {s.professorName ?? "Docente por asignar"} · {MODALITY[s.modality]}
                        </div>
                        <div className="mt-1 text-[11px] text-utp-muted">
                          Vacantes: {Math.max(0, s.capacity - s.enrolled)} / {s.capacity}
                        </div>
                        {clash && (
                          <div className="mt-1 text-xs font-bold text-utp-red">Se cruza con {clash.course.name}</div>
                        )}
                      </td>
                      <td className="hidden px-2 py-3 sm:table-cell">{s.professorName ?? "Por asignar"}</td>
                      <td className="hidden px-2 py-3 sm:table-cell">
                        <span className="rounded-full bg-utp-chip px-3 py-1 text-[11px] font-bold text-white">
                          {MODALITY[s.modality]}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-right">
                        <button
                          disabled={full || !!clash || isCurrent}
                          onClick={() => onSelect(s)}
                          className="w-28 rounded-md border border-utp-navy py-1.5 text-xs text-utp-navy transition hover:bg-utp-violet-soft disabled:cursor-not-allowed disabled:border-utp-line disabled:text-utp-muted disabled:hover:bg-transparent"
                        >
                          {isCurrent ? "Seleccionada" : full ? "Sin vacantes" : "Seleccionar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
