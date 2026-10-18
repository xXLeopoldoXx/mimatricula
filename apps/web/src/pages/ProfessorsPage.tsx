import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Search } from "lucide-react";
import { useCatalog, useProfessorStats } from "../lib/catalog";
import NoOffer from "../components/NoOffer";
import ScoreBadge from "../components/ScoreBadge";

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
      <h1 className="text-2xl font-bold">Profesores</h1>
      <p className="mt-1 text-sm text-utp-muted">
        Notas calculadas con las reseñas de estudiantes. Con pocas reseñas, la nota se acerca al promedio general.
      </p>

      <div className="mt-4 flex flex-col gap-2 rounded-xl bg-white p-3 shadow-sm md:flex-row">
        <label className="flex flex-1 items-center gap-2 rounded-md border border-utp-line px-3 py-2">
          <Search size={16} className="text-utp-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar docente o área" className="w-full text-sm outline-none" />
        </label>
        <select value={course} onChange={(e) => setCourse(e.target.value)} className="rounded-md border border-utp-line bg-white px-2 py-2 text-sm" aria-label="Filtrar por curso">
          <option value="">Todos los cursos</option>
          {catalog.offer.courses.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-md border border-utp-line bg-white px-2 py-2 text-sm" aria-label="Ordenar">
          <option value="score">Mejor nota</option>
          <option value="recommend">Más recomendados</option>
          <option value="count">Más reseñas</option>
          <option value="name">Nombre</option>
        </select>
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => {
          const s = stats.get(p.id);
          const courses = [...(coursesByProf.get(p.id) ?? [])].map((c) => catalog.courseByCode.get(c)?.name).filter(Boolean);
          return (
            <li key={p.id}>
              <Link to={`/profesores/${p.id}`} className="flex h-full flex-col rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-utp-violet-soft text-sm font-bold text-utp-violet">
                    {p.name
                      .split(" ")
                      .slice(1, 3)
                      .map((w) => w[0])
                      .join("")}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold leading-tight">{p.name}</div>
                    <div className="text-xs text-utp-muted">{p.department}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <ScoreBadge stats={s} />
                </div>
                {s && s.topTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.topTags.slice(0, 3).map((t) => (
                      <span key={t} className="rounded-full bg-utp-bg px-2 py-0.5 text-[11px]">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-auto pt-3 text-xs text-utp-muted">{courses.join(" · ")}</div>
              </Link>
            </li>
          );
        })}
      </ul>
      {list.length === 0 && <p className="py-10 text-center text-sm text-utp-muted">No hay docentes con ese filtro.</p>}
    </div>
  );
}
