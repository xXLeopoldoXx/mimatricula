import { useMemo } from "react";
import {
  DAY_LABEL,
  DAY_SHORT,
  toMinutes,
  to12h,
  type Day,
  type EnrollmentOffer,
} from "@mimatricula/shared";
import type { useEnrollment } from "../lib/useEnrollment";

interface Props {
  offer: EnrollmentOffer;
  enrollment: ReturnType<typeof useEnrollment>;
}

const DAYS: Day[] = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];
const START = 7 * 60;
const END = 23 * 60;
const PX_PER_MIN = 0.8;
const COLORS = [
  "bg-violet-100 border-violet-500 text-violet-900",
  "bg-rose-100 border-rose-500 text-rose-900",
  "bg-sky-100 border-sky-500 text-sky-900",
  "bg-emerald-100 border-emerald-500 text-emerald-900",
  "bg-amber-100 border-amber-500 text-amber-900",
  "bg-teal-100 border-teal-500 text-teal-900",
  "bg-fuchsia-100 border-fuchsia-500 text-fuchsia-900",
  "bg-orange-100 border-orange-500 text-orange-900",
];

export default function HorarioPage({ offer, enrollment }: Props) {
  const blocks = useMemo(() => {
    const byCode = new Map(offer.sections.map((s) => [s.code, s]));
    return offer.courses
      .filter((c) => enrollment.picks[c.code])
      .flatMap((c, i) => {
        const sec = byCode.get(enrollment.picks[c.code]);
        if (!sec) return [];
        return sec.sessions.map((ss) => ({ course: c, section: sec, session: ss, color: COLORS[i % COLORS.length] }));
      });
  }, [offer, enrollment.picks]);

  const hours = Array.from({ length: (END - START) / 60 }, (_, i) => START / 60 + i);

  return (
    <div className="mx-auto max-w-6xl rounded-xl bg-white p-4 shadow-sm md:p-6">
      <h1 className="text-xl font-bold md:text-2xl">Mi horario</h1>
      <p className="mt-1 text-sm text-utp-muted">
        {enrollment.completedAt ? "Matrícula registrada." : "Vista previa con las secciones seleccionadas (aún sin registrar)."}
      </p>

      {blocks.length === 0 && (
        <p className="py-12 text-center text-sm text-utp-muted">
          Todavía no seleccionaste secciones. Ve a <a className="underline" href="#/matricula">Matrícula</a>.
        </p>
      )}

      {blocks.length > 0 && (
        <>
          {/* Grilla (escritorio) */}
          <div className="mt-5 hidden overflow-x-auto md:block">
            <div className="grid min-w-[720px]" style={{ gridTemplateColumns: `56px repeat(${DAYS.length}, 1fr)` }}>
              <div />
              {DAYS.map((d) => (
                <div key={d} className="border-b border-utp-line pb-2 text-center text-sm font-bold">
                  {DAY_LABEL[d]}
                </div>
              ))}
              <div className="relative" style={{ height: (END - START) * PX_PER_MIN }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute right-2 -translate-y-1/2 text-[11px] text-utp-muted"
                    style={{ top: (h * 60 - START) * PX_PER_MIN }}
                  >
                    {String(h).padStart(2, "0")}:00
                  </div>
                ))}
              </div>
              {DAYS.map((d) => (
                <div key={d} className="relative border-l border-utp-line" style={{ height: (END - START) * PX_PER_MIN }}>
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute inset-x-0 border-t border-dashed border-utp-line/70"
                      style={{ top: (h * 60 - START) * PX_PER_MIN }}
                    />
                  ))}
                  {blocks
                    .filter((b) => b.session.day === d)
                    .map((b, i) => {
                      const top = (toMinutes(b.session.start) - START) * PX_PER_MIN;
                      const height = (toMinutes(b.session.end) - toMinutes(b.session.start)) * PX_PER_MIN;
                      return (
                        <div
                          key={i}
                          className={`absolute inset-x-1 overflow-hidden rounded-md border-l-4 px-2 py-1 text-[11px] leading-tight ${b.color}`}
                          style={{ top, height }}
                        >
                          <div className="font-bold">{b.course.name}</div>
                          <div>
                            {b.session.start}–{b.session.end} · {b.session.room}
                          </div>
                          <div className="opacity-80">Secc. {b.section.code}</div>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>

          {/* Lista por día (móvil) */}
          <div className="mt-4 flex flex-col gap-4 md:hidden">
            {DAYS.map((d) => {
              const today = blocks
                .filter((b) => b.session.day === d)
                .sort((a, b) => a.session.start.localeCompare(b.session.start));
              if (!today.length) return null;
              return (
                <div key={d}>
                  <div className="mb-1.5 text-sm font-bold">{DAY_LABEL[d]}</div>
                  <ul className="flex flex-col gap-2">
                    {today.map((b, i) => (
                      <li key={i} className={`rounded-md border-l-4 px-3 py-2 text-xs ${b.color}`}>
                        <div className="font-bold">{b.course.name}</div>
                        <div>
                          {DAY_SHORT[d]} {to12h(b.session.start)} – {to12h(b.session.end)} · {b.session.room}
                        </div>
                        <div className="opacity-80">
                          Secc. {b.section.code} · {b.section.professorName ?? "Docente por asignar"}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
