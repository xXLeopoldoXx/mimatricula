import type { ProfessorStats } from "@mimatricula/shared";
import { Stars } from "./Stars";

/** Nota del docente con estrellas y cantidad de reseñas. */
export default function ScoreBadge({ stats, compact }: { stats?: ProfessorStats; compact?: boolean }) {
  if (!stats) return <span className="text-xs text-utp-muted">Sin reseñas</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
      <b className="text-sm text-utp-ink">{stats.overall.toFixed(1)}</b>
      <Stars value={stats.overall} size={compact ? 12 : 14} />
      <span className="text-utp-muted">
        ({stats.count}){!compact && <> · {stats.recommendPct}% lo recomienda</>}
      </span>
    </span>
  );
}
