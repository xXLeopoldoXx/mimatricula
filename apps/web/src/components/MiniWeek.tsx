import { DAY_SHORT, toMinutes, type Day } from "@mimatricula/shared";
import type { Chosen } from "../lib/catalog";

const DAYS: Day[] = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];

/** Colores para fondo oscuro: relleno translúcido y borde sólido. */
export const NIGHT_COLORS = ["#8b6dff", "#ff6b7a", "#38bdf8", "#34d399", "#fbbf24", "#f472b6", "#2dd4bf", "#fb923c", "#a3e635", "#818cf8", "#22d3ee", "#e879f9"];

/** Bloques de ejemplo cuando todavía no hay secciones elegidas (día, inicio h, duración h). */
const GHOST: [number, number, number][] = [
  [0, 8, 2],
  [0, 14, 1.5],
  [1, 10, 2],
  [2, 8, 3],
  [3, 15, 2],
  [4, 9, 2],
  [4, 13, 1.5],
  [5, 9, 3],
];

/**
 * Vista compacta de la semana para el hero. Usa tus secciones reales;
 * si aún no hay, dibuja huecos para mostrar dónde caerán.
 */
export default function MiniWeek({ chosen, animate = true }: { chosen: Chosen[]; animate?: boolean }) {
  const blocks = chosen.flatMap((c, i) =>
    c.section.sessions.map((s) => ({
      day: DAYS.indexOf(s.day),
      start: toMinutes(s.start),
      end: toMinutes(s.end),
      name: c.course.name,
      room: s.room,
      color: NIGHT_COLORS[i % NIGHT_COLORS.length]!,
    })),
  );
  const empty = blocks.length === 0;
  const START = empty ? 7 * 60 : Math.min(8 * 60, Math.floor(Math.min(...blocks.map((b) => b.start)) / 60) * 60);
  const END = empty ? 18 * 60 : Math.max(14 * 60, Math.ceil(Math.max(...blocks.map((b) => b.end)) / 60) * 60);
  const span = END - START;
  const ghost = GHOST.map(([d, h, len]) => ({ day: d, start: h * 60, end: (h + len) * 60 }));
  const HEIGHT = 250;

  return (
    <div className="select-none" aria-label={empty ? "Semana sin secciones elegidas" : "Resumen de tu semana"} role="img">
      <div className="grid grid-cols-6 gap-1.5 text-center text-xs font-medium text-white/60">
        {DAYS.map((d) => (
          <div key={d}>{DAY_SHORT[d]}</div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-6 gap-1.5" style={{ height: HEIGHT }}>
        {DAYS.map((_, di) => (
          <div key={di} className="relative rounded-lg bg-white/[0.04]">
            {empty
              ? ghost
                  .map((g, gi) => ({ g, gi }))
                  .filter(({ g }) => g.day === di)
                  .map(({ g, gi }) => (
                    <div
                      key={gi}
                      className={`absolute inset-x-0.5 rounded-md border border-dashed border-white/25 bg-white/[0.05] ${animate ? "block-in" : ""}`}
                      style={{
                        top: `${((g.start - START) / span) * 100}%`,
                        height: `${((Math.min(g.end, END) - g.start) / span) * 100}%`,
                        animationDelay: `${120 + gi * 90}ms`,
                      }}
                    />
                  ))
              : blocks
                  .map((b, bi) => ({ b, bi }))
                  .filter(({ b }) => b.day === di)
                  .map(({ b, bi }) => (
                    <div
                      key={bi}
                      className={`absolute inset-x-0.5 overflow-hidden rounded-md px-1.5 py-1 text-[10px] leading-tight font-semibold text-white ${animate ? "block-in" : ""}`}
                      style={{
                        top: `${((b.start - START) / span) * 100}%`,
                        height: `${((b.end - b.start) / span) * 100}%`,
                        background: `${b.color}38`,
                        borderLeft: `3px solid ${b.color}`,
                        animationDelay: `${120 + bi * 90}ms`,
                      }}
                      title={`${b.name} · ${b.room}`}
                    >
                      {b.name}
                    </div>
                  ))}
          </div>
        ))}
      </div>
    </div>
  );
}
