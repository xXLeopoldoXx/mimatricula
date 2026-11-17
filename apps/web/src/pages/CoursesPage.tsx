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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Cursos a matricular</h1>
          <p className="page-lead">
            Oferta {catalog.offer.term}. Elige una sección por curso; los cursos repetidos aparecen primero.
          </p>
        </div>
        <div className={`card px-5 py-3 text-sm ${credits > MAX_CREDITS ? "text-utp-red" : ""}`}>
          <b className="font-display text-xl tabular-nums">{chosen.length}</b> {chosen.length === 1 ? "curso" : "cursos"}
          <span className="text-utp-line mx-3">|</span>
          <b className="font-display text-xl tabular-nums">{credits}</b> / {MAX_CREDITS} créditos
        </div>
      </div>

      <div className="card z-20 mt-6 flex flex-col gap-3 p-3 sm:sticky sm:top-[3.75rem] sm:flex-row sm:items-center lg:top-3">
        <label className="border-utp-line focus-within:border-utp-violet focus-within:ring-utp-violet/15 flex flex-1 items-center gap-2 rounded-xl border px-3.5 py-2.5 focus-within:ring-4">
          <Search size={17} className="text-utp-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar curso o código"
            aria-label="Buscar curso o código"
            className="w-full bg-transparent text-sm outline-none"
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
            className="border-utp-line focus:border-utp-violet rounded-xl border bg-white px-3 text-sm font-medium outline-none"
            aria-label="Ordenar secciones"
          >
            <option value="docente">Mejor docente</option>
            <option value="horario">Por horario</option>
          </select>
        </div>
      </div>

      <ul className="mt-5 flex flex-col gap-3">
        {[...courses]
          .sort((a, b) => Number(b.repeated) - Number(a.repeated))
          .map((c) => {
            const sections = sortSections(
              (catalog.sectionsByCourse.get(c.code) ?? []).filter((s) => shift === "TODOS" || s.shift === shift),
            );
            const pickedSection = picks[c.code] ? catalog.sectionByCode.get(picks[c.code]!) : undefined;
            const expanded = open.has(c.code) || !!q;
            return (
              <li key={c.code} className={`card scroll-mt-32 overflow-hidden transition-shadow ${expanded ? "shadow-lift" : ""}`} id={c.code}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-4">
                  <button
                    onClick={() => toggle(c.code)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    aria-expanded={expanded}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${expanded ? "bg-utp-violet text-white" : "bg-utp-bg text-utp-muted"}`}><ChevronDown size={18} className={`transition-transform ${expanded ? "rotate-180" : ""}`} /></span>
                    <span className="min-w-0">
                      <span className="block text-[17px] font-semibold">
                        <span className="text-utp-muted font-medium">{c.code}</span> {c.name}
                        {c.repeated && <span className="bg-utp-red ml-2 rounded-md px-1.5 py-0.5 align-middle text-[11px] font-bold text-white">Repetido</span>}
                      </span>
                      <span className="text-utp-muted mt-0.5 block text-[13px]">
                        {c.credits} créditos, {c.weeklyHours} h por semana, ciclo {c.cycle}. {c.type === "OBLIGATORIO" ? "Obligatorio" : "Electivo"} con {sections.length} secciones.
                      </span>
                    </span>
                  </button>
                  {pickedSection && (
                    <span className="bg-utp-violet-soft text-utp-violet flex items-center gap-1 rounded-full py-1 pr-1 pl-3 text-xs font-bold">
                      Sección {pickedSection.code}
                      <button
                        onClick={() => remove(c.code)}
                        className="rounded-full p-1 hover:bg-white"
                        aria-label={`Quitar ${c.name}`}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  )}
                </div>
                {expanded && (
                  <ul className="divide-utp-line border-utp-line divide-y border-t">
                    {sections.length === 0 && <li className="text-utp-muted px-5 py-8 text-center text-sm">No hay secciones en este turno.</li>}
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
    <div className="bg-utp-bg flex rounded-xl p-1" role="radiogroup">
      {options.map(([v, label]) => (
        <button
          key={v}
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${value === v ? "text-utp-violet bg-white shadow-sm" : "text-utp-muted hover:text-utp-ink"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
