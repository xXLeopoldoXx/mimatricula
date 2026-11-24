import { useCatalog } from "../lib/catalog";
import { useCycle } from "../store/cycle";

/** Selector de ciclo para ofertas con varios ciclos. Los cursos repetidos siempre aparecen. */
export default function CycleBar() {
  const catalog = useCatalog();
  const set = useCycle((s) => s.set);
  if (!catalog || catalog.cycles.length < 2) return null;
  const options = ["TODOS", ...catalog.cycles.filter((c) => Number(c) > 0)];
  return (
    <div className="wrap pt-4" role="group" aria-label="Ciclo">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-utp-muted mr-1 text-xs font-semibold">Ciclo</span>
        {options.map((c) => {
          const on = catalog.cycle === c;
          return (
            <button
              key={c}
              type="button"
              aria-pressed={on}
              onClick={() => set(c)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                on ? "border-utp-violet bg-utp-violet text-white" : "border-utp-line bg-white hover:border-utp-violet/40"
              }`}
            >
              {c === "TODOS" ? "Todos" : Number(c)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
