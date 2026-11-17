import type { ProfessorStats } from "@mimatricula/shared";
import { Stars } from "./Stars";

/** Color de la nota según su nivel: la nota es el dato principal de la app. */
export function tierOf(score: number): string {
  if (score >= 4.2) return "bg-utp-mint-soft text-utp-mint";
  if (score >= 3.5) return "bg-utp-violet-soft text-utp-violet";
  return "bg-utp-amber-soft text-amber-800";
}

/** Nota del docente con estrellas y cantidad de reseñas. */
export default function ScoreBadge({ stats, compact }: { stats?: ProfessorStats; compact?: boolean }) {
  if (!stats) return <span className="text-utp-muted text-xs">Sin reseñas todavía</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <b className={`rounded-md px-1.5 py-0.5 text-[13px] tabular-nums ${tierOf(stats.overall)}`}>{stats.overall.toFixed(1)}</b>
      <Stars value={stats.overall} size={compact ? 12 : 14} />
      <span className="text-utp-muted">({stats.count})</span>
      {!compact && <span className="text-utp-muted">{stats.recommendPct}% lo recomienda</span>}
    </span>
  );
}
