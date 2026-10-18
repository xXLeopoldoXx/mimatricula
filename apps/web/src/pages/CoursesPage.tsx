import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { ChevronDown, Search, X } from "lucide-react";
import { DAYS, type Section, type Shift } from "@mimatricula/shared";
import { round2, useCatalog, useChosen, useProfessorStats, MAX_CREDITS } from "../lib/catalog";
import { useSelection } from "../store/selection";
import NoOffer from "../components/NoOffer";
import SectionRow from "../components/SectionRow";

type Sort = "docente" | "horario";

export default function CoursesPage() {
  const catalog = useCatalog();
  const chosen = useChosen(catalog);
  const stats = useProfessorStats();
  const picks = useSelection((s) => s.picks);
  const remove = useSelection((s) => s.remove);

  const [query, setQuery] = useState("");
  const [shift, setShift] = useState<Shift | "TODOS">("TODOS");
  const [sort, setSort] = useState<Sort>("docente");
  const { hash } = useLocation();
  // Desde "Cambiar" en Mi Horario llega /cursos#CODIGO: se abre y se muestra ese curso
  const [open, setOpen] = useState<Set<string>>(() => new Set(hash ? [decodeURIComponent(hash.slice(1))] : []));
  useEffect(() => {
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: "start" });
  }, [hash]);

  const sortSections = useMemo(() => {
    const timeKey = (s: Section) => `${DAYS.indexOf(s.sessions[0]!.day)}${s.sessions[0]!.start}`;
    return (list: Section[]) =>
      [...list].sort((a, b) =>
        sort === "docente"
          ? (stats.get(b.professorId ?? "")?.score ?? 0) - (stats.get(a.professorId ?? "")?.score ?? 0)
          : timeKey(a).localeCompare(timeKey(b)),
      );
  }, [sort, stats]);

  if (!catalog) return <NoOffer />;

  const q = query.trim().toLowerCase();
  const courses = catalog.offer.courses.filter(
    (c) => !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
  );
  const credits = round2(chosen.reduce((a, c) => a + c.course.credits, 0));

  const toggle = (code: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Cursos a matricular</h1>
          <p className="mt-1 text-sm text-utp-muted">
            Oferta {catalog.offer.term} · elige una sección por curso. Los cursos repetidos van primero.
          </p>
        </div>
        <div className={`rounded-lg bg-white px-4 py-2 text-sm shadow-sm ${credits > MAX_CREDITS ? "text-utp-red" : ""}`}>
          <b>{chosen.length}</b> cursos · <b>{credits}</b> / {MAX_CREDITS} créditos
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 rounded-xl bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <label className="flex flex-1 items-center gap-2 rounded-md border border-utp-line px-3 py-2">
          <Search size={16} className="text-utp-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar curso o código"
            className="w-full text-sm outline-none"
          />
        </label>
        <div className="flex gap-2">
          <Segmented
            value={shift}
            onChange={setShift}
            options={[
              ["TODOS", "Todos"],
              ["MANANA", "Mañana"],
              ["NOCHE", "Noche"],
            ]}
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-md border border-utp-line bg-white px-2 text-sm"
            aria-label="Ordenar secciones"
          >
            <option value="docente">Mejor docente</option>
            <option value="horario">Por horario</option>
          </select>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {[...courses]
          .sort((a, b) => Number(b.repeated) - Number(a.repeated))
          .map((c) => {
            const sections = sortSections(
              (catalog.sectionsByCourse.get(c.code) ?? []).filter((s) => shift === "TODOS" || s.shift === shift),
            );
            const pickedSection = picks[c.code] ? catalog.sectionByCode.get(picks[c.code]!) : undefined;
            const expanded = open.has(c.code) || !!q;
            return (
              <li key={c.code} className="overflow-hidden rounded-xl bg-white shadow-sm" id={c.code}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
                  <button
                    onClick={() => toggle(c.code)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    aria-expanded={expanded}
                  >
                    <ChevronDown size={18} className={`shrink-0 transition ${expanded ? "rotate-180" : ""}`} />
                    <span className="min-w-0">
                      <span className="block font-bold">
                        {c.code} · {c.name}
                        {c.repeated && (
                          <span className="ml-2 rounded bg-utp-red px-1.5 py-0.5 align-middle text-[10px] text-white">REPETIDO</span>
                        )}
                      </span>
                      <span className="block text-xs text-utp-muted">
                        {c.credits} créditos · {c.weeklyHours} h/sem · ciclo {c.cycle} ·{" "}
                        {c.type === "OBLIGATORIO" ? "Obligatorio" : "Electivo"} · {sections.length} secciones
                      </span>
                    </span>
                  </button>
                  {pickedSection && (
                    <span className="flex items-center gap-1 rounded-full bg-utp-violet-soft py-1 pr-1 pl-3 text-xs font-bold text-utp-violet">
                      Sección {pickedSection.code}
                      <button
                        onClick={() => remove(c.code)}
                        className="rounded-full p-0.5 hover:bg-white"
                        aria-label={`Quitar ${c.name}`}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  )}
                </div>
                {expanded && (
                  <ul className="divide-y divide-utp-line border-t border-utp-line">
                    {sections.length === 0 && <li className="px-4 py-6 text-center text-sm text-utp-muted">No hay secciones en este turno.</li>}
                    {sections.map((s) => (
                      <SectionRow key={s.code} course={c} section={s} chosen={chosen} stats={stats.get(s.professorId ?? "")} />
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
      </ul>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
}) {
  return (
    <div className="flex rounded-md border border-utp-line p-0.5" role="radiogroup">
      {options.map(([v, label]) => (
        <button
          key={v}
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`rounded px-3 py-1.5 text-xs font-bold ${value === v ? "bg-utp-violet text-white" : "text-utp-muted hover:bg-utp-bg"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
