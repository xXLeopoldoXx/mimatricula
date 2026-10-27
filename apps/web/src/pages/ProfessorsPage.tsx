import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Search } from "lucide-react";
import { useCatalog, useProfessorStats } from "../lib/catalog";
import NoOffer from "../components/NoOffer";
import ScoreBadge, { tierOf } from "../components/ScoreBadge";

type Sort = "score" | "recommend" | "count" | "name";

export default function ProfessorsPage() {
  const catalog = useCatalog();
  const stats = useProfessorStats();
  const [query, setQuery] = useState("");
  const [course, setCourse] = useState("");
  const [sort, setSort] = useState<Sort>("score");

  const coursesByProf = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const s of catalog?.offer.sections ?? []) {
      if (!s.professorId) continue;
      if (!m.has(s.professorId)) m.set(s.professorId, new Set());
      m.get(s.professorId)!.add(s.courseCode);
    }
    return m;
  }, [catalog]);

  if (!catalog) return <NoOffer />;

  const q = query.trim().toLowerCase();
  const list = catalog.offer.professors
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.department.toLowerCase().includes(q))
    .filter((p) => !course || coursesByProf.get(p.id)?.has(course))
    .sort((a, b) => {
      const sa = stats.get(a.id);
      const sb = stats.get(b.id);
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "recommend") return (sb?.recommendPct ?? -1) - (sa?.recommendPct ?? -1);
      if (sort === "count") return (sb?.count ?? 0) - (sa?.count ?? 0);
      return (sb?.score ?? 0) - (sa?.score ?? 0);
    });

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="page-title">Profesores</h1>
      <p className="page-lead">Notas calculadas con las reseñas de estudiantes. Con pocas reseñas, la nota se acerca al promedio general para no exagerar.</p>

      <div className="card mt-6 flex flex-col gap-3 p-3 md:flex-row">
        <label className="border-utp-line focus-within:border-utp-violet focus-within:ring-utp-violet/15 flex flex-1 items-center gap-2 rounded-xl border px-3.5 py-2.5 focus-within:ring-4">
          <Search size={17} className="text-utp-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar docente o área" aria-label="Buscar docente o área" className="w-full bg-transparent text-sm outline-none" />
        </label>
        <select value={course} onChange={(e) => setCourse(e.target.value)} className="border-utp-line focus:border-utp-violet rounded-xl border bg-white px-3 py-2.5 text-sm font-medium outline-none" aria-label="Filtrar por curso">
          <option value="">Todos los cursos</option>
          {catalog.offer.courses.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="border-utp-line focus:border-utp-violet rounded-xl border bg-white px-3 py-2.5 text-sm font-medium outline-none" aria-label="Ordenar">
          <option value="score">Mejor nota</option>
          <option value="recommend">Más recomendados</option>
          <option value="count">Más reseñas</option>
          <option value="name">Nombre</option>
        </select>
      </div>

      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => {
          const s = stats.get(p.id);
          const courses = [...(coursesByProf.get(p.id) ?? [])].map((c) => catalog.courseByCode.get(c)?.name).filter(Boolean);
          return (
            <li key={p.id}>
              <Link to={`/profesores/${p.id}`} className="card hover:shadow-lift hover:border-utp-violet/30 flex h-full flex-col p-5 transition-shadow">
                <div className="flex items-start gap-3">
                  <span className="bg-utp-violet-soft text-utp-violet flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                    {p.name
                      .split(" ")
                      .slice(1, 3)
                      .map((w) => w[0])
                      .join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold leading-tight">{p.name}</div>
                    <div className="text-utp-muted mt-0.5 text-xs">{p.department}</div>
                  </div>
                  {s && <span className={`font-display rounded-xl px-2.5 py-1 text-xl font-bold tabular-nums ${tierOf(s.overall)}`}>{s.overall.toFixed(1)}</span>}
                </div>
                <div className="mt-4">
                  <ScoreBadge stats={s} />
                </div>
                {s && s.topTags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.topTags.slice(0, 3).map((t) => (
                      <span key={t} className="bg-utp-bg rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-utp-muted border-utp-line mt-auto border-t pt-3 text-xs leading-relaxed">
                  {courses.join(", ")}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {list.length === 0 && <p className="text-utp-muted py-12 text-center text-sm">No hay docentes con ese filtro.</p>}
    </div>
  );
}
