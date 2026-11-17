import { CalendarCheck, CircleAlert, Clock3, Star, Zap } from "lucide-react";
import { NIGHT_COLORS } from "./MiniWeek";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie"];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15];

/** Bloques decorativos sobre la retícula: columna (día), fila (hora desde las 8), alto en filas. */
const BLOCKS: { c: number; r: number; h: number; name: string; room: string }[] = [
  { c: 0, r: 0, h: 3, name: "Cálculo", room: "A-301" },
  { c: 0, r: 4, h: 2, name: "Algoritmos", room: "Lab 2" },
  { c: 1, r: 0, h: 2, name: "Física", room: "B-105" },
  { c: 1, r: 6, h: 2, name: "Ética", room: "C-210" },
  { c: 2, r: 0, h: 2, name: "Redacción", room: "A-112" },
  { c: 2, r: 3, h: 3, name: "Base de datos", room: "Lab 4" },
  { c: 3, r: 1, h: 3, name: "Álgebra", room: "B-204" },
  { c: 3, r: 5, h: 2, name: "Redes", room: "Lab 1" },
  { c: 4, r: 0, h: 2, name: "Inglés", room: "D-101" },
  { c: 4, r: 3, h: 2, name: "Taller", room: "C-004" },
];

/** Geometría de fondo: anillos concéntricos, un reloj de marcas y una órbita. Puro SVG, sin interacción. */
export function GeoRings({ marks = true }: { marks?: boolean }) {
  const cx = 560;
  const cy = 700;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 600 800"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
      fill="none"
    >
      <g stroke="white">
        <circle cx={cx} cy={cy} r="150" strokeOpacity="0.1" />
        <circle cx={cx} cy={cy} r="250" strokeOpacity="0.08" />
        <circle cx={cx} cy={cy} r="350" strokeOpacity="0.06" />
        {/* anillo de marcas: se lee como un reloj / regla de tiempo */}
        <g className="orbit" style={{ ["--t" as string]: "140s", transformOrigin: `${cx}px ${cy}px` }}>
          <circle cx={cx} cy={cy} r="200" strokeOpacity="0.3" strokeWidth="6" strokeDasharray="1.5 14.6" />
        </g>
      </g>
      {/* arco naranja y punto en órbita */}
      <g className="orbit orbit-rev" style={{ ["--t" as string]: "60s", transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx} cy={cy} r="250" stroke="#ff7a1a" strokeWidth="2" strokeLinecap="round" strokeDasharray="150 1420" strokeOpacity="0.85" />
        <circle cx={cx + 250} cy={cy} r="5" fill="#ff7a1a" />
      </g>
      <g className="orbit" style={{ ["--t" as string]: "95s", transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx - 350} cy={cy} r="4" fill="white" fillOpacity="0.55" />
      </g>
      {/* cruces: el "+" del logo repetido como retícula */}
      {marks && <g stroke="white" strokeOpacity="0.3" strokeLinecap="round" strokeWidth="1.5">
        {[
          [60, 150],
          [300, 60],
          [520, 170],
          [90, 520],
        ].map(([x, y]) => (
          <path key={`${x}-${y}`} d={`M${x! - 5} ${y}h10M${x} ${y! - 5}v10`} />
        ))}
      </g>}
    </svg>
  );
}

/**
 * Escena animada del login. Cuenta la historia del producto en un ciclo:
 * la semana se arma, un curso choca con otro (rojo), el sistema lo acomoda (verde).
 */
export default function AuthScene() {
  return (
    <div className="scene w-full max-w-[540px]" aria-hidden="true">
      <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-5 shadow-[0_30px_60px_-30px_rgb(8_20_80/0.7)] backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-xs font-bold tracking-wide text-white/80 uppercase">
            <Clock3 size={14} /> Tu semana
          </span>
          <span className="relative h-7 w-40">
            <span className="scene-chip scene-chip-bad">
              <CircleAlert size={13} /> Cruce detectado
            </span>
            <span className="scene-chip scene-chip-ok">
              <CalendarCheck size={13} /> Sin cruces
            </span>
          </span>
        </div>

        <div className="flex">
          <div className="w-9 shrink-0 pt-6 text-right">
            {HOURS.map((h) => (
              <div key={h} className="pr-2 text-[10px] leading-none font-semibold text-white/45 tabular-nums" style={{ height: "var(--row)" }}>
                {h}:00
              </div>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-5 pb-2 text-center text-[11px] font-bold tracking-wide text-white/60 uppercase">
              {DAYS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="scene-grid">
              {BLOCKS.map((b, i) => {
                const k = NIGHT_COLORS[i % NIGHT_COLORS.length]!;
                return (
                  <div key={b.name} className="scene-block" style={{ ["--c" as string]: b.c, ["--r" as string]: b.r, ["--h" as string]: b.h, ["--i" as string]: i, ["--k" as string]: k }}>
                    {b.name}
                    <small>{b.room}</small>
                  </div>
                );
              })}
              <div className="scene-block scene-conflict" style={{ ["--c" as string]: 1, ["--r" as string]: 3, ["--h" as string]: 2, ["--i" as string]: 0, ["--k" as string]: "#34d399" }}>
                Estadística
                <small>B-310</small>
              </div>
              <div className="scene-scan" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const AUTH_FEATURES = [
  { icon: Star, label: "Reseñas reales" },
  { icon: CalendarCheck, label: "Cero cruces" },
  { icon: Zap, label: "En minutos" },
] as const;
