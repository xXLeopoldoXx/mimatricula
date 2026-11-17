import { DAY_LABEL, DAY_SHORT, to12h, toMinutes, type BusyBlock, type Day } from "@mimatricula/shared";
import { clashWith, type Chosen } from "../lib/catalog";

const DAYS: Day[] = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];
const PX_PER_MIN = 0.8;

export const COURSE_COLORS = [
  "bg-violet-100 border-violet-500 text-violet-950",
  "bg-rose-100 border-rose-500 text-rose-950",
  "bg-sky-100 border-sky-500 text-sky-950",
  "bg-emerald-100 border-emerald-500 text-emerald-950",
  "bg-amber-100 border-amber-500 text-amber-950",
  "bg-teal-100 border-teal-500 text-teal-950",
  "bg-fuchsia-100 border-fuchsia-500 text-fuchsia-950",
  "bg-orange-100 border-orange-500 text-orange-950",
  "bg-lime-100 border-lime-600 text-lime-950",
  "bg-indigo-100 border-indigo-500 text-indigo-950",
  "bg-cyan-100 border-cyan-600 text-cyan-950",
  "bg-pink-100 border-pink-500 text-pink-950",
];

const BUSY_STYLE = "bg-[repeating-linear-gradient(135deg,#e6e8f2_0_6px,#f2f3f9_6px_12px)] border-slate-400 text-slate-700";

/**
 * Horario semanal con horas reales (minutos). Grilla en escritorio, lista por día en el celular.
 * `busy` dibuja en gris las horas ocupadas del estudiante (trabajo).
 */
export default function WeekGrid({ chosen, busy = [] }: { chosen: Chosen[]; busy?: BusyBlock[] }) {
  const blocks = chosen.flatMap((c, i) =>
    c.section.sessions.map((session) => ({
      ...c,
      session,
      color: COURSE_COLORS[i % COURSE_COLORS.length]!,
      clash: !!clashWith(c.section, chosen, c.course.code),
    })),
  );

  // Rango visible: de la primera a la última clase, redondeado a la hora
  const starts = [...blocks.map((b) => b.session.start), ...busy.map((b) => b.start)].map(toMinutes);
  const ends = [...blocks.map((b) => b.session.end), ...busy.map((b) => b.end)].map(toMinutes);
  const START = Math.min(8 * 60, Math.floor(Math.min(...starts, 8 * 60) / 60) * 60);
  const END = Math.max(18 * 60, Math.ceil(Math.max(...ends, 18 * 60) / 60) * 60);
  const hours = Array.from({ length: (END - START) / 60 + 1 }, (_, i) => START / 60 + i);
  const height = (END - START) * PX_PER_MIN;

  return (
    <>
      <div className="hidden overflow-x-auto pb-2 md:block">
        <div className="grid min-w-[720px]" style={{ gridTemplateColumns: `56px repeat(${DAYS.length}, 1fr)` }}>
          <div />
          {DAYS.map((d) => (
            <div key={d} className="border-utp-line text-utp-ink border-b pb-3 text-center text-sm font-semibold">
              {DAY_LABEL[d]}
            </div>
          ))}
          <div className="relative" style={{ height }}>
            {hours.map((h) => (
              <div key={h} className="text-utp-muted absolute right-3 -translate-y-1/2 text-[11px] tabular-nums" style={{ top: (h * 60 - START) * PX_PER_MIN }}>
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          {DAYS.map((d) => (
            <div key={d} className={`border-utp-line relative border-l ${d === "SAB" ? "bg-utp-bg/50" : ""}`} style={{ height }}>
              {hours.map((h) => (
                <div key={h} className="border-utp-line/80 absolute inset-x-0 border-t" style={{ top: (h * 60 - START) * PX_PER_MIN }} />
              ))}
              {busy
                .filter((b) => b.day === d)
                .map((b, i) => (
                  <div
                    key={`busy-${i}`}
                    className={`absolute inset-x-1 rounded-lg border-l-4 px-2 py-1 text-[11px] font-semibold ${BUSY_STYLE}`}
                    style={{
                      top: (toMinutes(b.start) - START) * PX_PER_MIN,
                      height: (toMinutes(b.end) - toMinutes(b.start)) * PX_PER_MIN,
                    }}
                  >
                    {b.label} {b.start}–{b.end}
                  </div>
                ))}
              {blocks
                .filter((b) => b.session.day === d)
                .map((b, i) => (
                  <div
                    key={i}
                    className={`absolute inset-x-1 overflow-hidden rounded-lg border-l-4 px-2 py-1.5 text-[11px] leading-tight shadow-sm ${b.color} ${
                      b.clash ? "ring-utp-red ring-2" : ""
                    }`}
                    style={{
                      top: (toMinutes(b.session.start) - START) * PX_PER_MIN,
                      height: (toMinutes(b.session.end) - toMinutes(b.session.start)) * PX_PER_MIN,
                    }}
                    title={`${b.course.name} · ${b.section.professorName ?? ""}`}
                  >
                    <div className="text-xs font-bold">{b.course.name}</div>
                    <div className="mt-0.5 opacity-80">
                      {b.session.start}–{b.session.end} · {b.session.room}
                    </div>
                    <div className="opacity-80">{b.section.professorName}</div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 md:hidden">
        {DAYS.map((d) => {
          const today = blocks.filter((b) => b.session.day === d).sort((a, b) => a.session.start.localeCompare(b.session.start));
          const busyToday = busy.filter((b) => b.day === d);
          if (!today.length && !busyToday.length) return null;
          return (
            <div key={d}>
              <div className="mb-2 text-sm font-semibold">{DAY_LABEL[d]}</div>
              <ul className="flex flex-col gap-2">
                {busyToday.map((b, i) => (
                  <li key={`busy-${i}`} className={`rounded-lg border-l-4 px-3 py-2 text-xs font-semibold ${BUSY_STYLE}`}>
                    {b.label} · {to12h(b.start)} – {to12h(b.end)}
                  </li>
                ))}
                {today.map((b, i) => (
                  <li key={i} className={`rounded-lg border-l-4 px-3 py-2.5 text-xs ${b.color} ${b.clash ? "ring-utp-red ring-2" : ""}`}>
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
  );
}
