import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, Search, X } from "lucide-react";
import { normalizeText, professorKey } from "@mimatricula/shared";
import { useDirectory, useProfessorStats } from "../lib/catalog";
import { communityId, useCommunityProfessors } from "../store/professors";
import ScoreBadge, { tierOf } from "../components/ScoreBadge";

type Sort = "score" | "recommend" | "count" | "name";

export default function ProfessorsPage() {
  const dir = useDirectory();
  const stats = useProfessorStats();
  const [query, setQuery] = useState("");
  const [course, setCourse] = useState("");
  const [sort, setSort] = useState<Sort>("score");
  const [adding, setAdding] = useState(false);

  const courseList = useMemo(
    () => [...dir.courses.values()].sort((a, b) => a.cycle.localeCompare(b.cycle) || a.name.localeCompare(b.name)),
    [dir.courses],
  );

  const q = normalizeText(query);
  const list = [...dir.professors.values()]
    .filter((p) => !q || normalizeText(p.name).includes(q) || normalizeText(p.department).includes(q))
    .filter((p) => !course || dir.coursesByProf.get(p.id)?.has(course))
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Profesores</h1>
          <p className="page-lead">Notas calculadas con las reseñas de estudiantes. Con pocas reseñas, la nota se acerca al promedio general para no exagerar.</p>
        </div>
        <button type="button" onClick={() => setAdding((v) => !v)} className="btn btn-primary" aria-expanded={adding}>
          {adding ? <X size={16} /> : <Plus size={16} />} {adding ? "Cerrar" : "Agregar docente"}
        </button>
      </div>
      {adding && <AddProfessor onDone={() => setAdding(false)} />}

      <div className="card mt-6 flex flex-col gap-3 p-3 md:flex-row">
        <label className="border-utp-line focus-within:border-utp-violet focus-within:ring-utp-violet/15 flex flex-1 items-center gap-2 rounded-xl border px-3.5 py-2.5 focus-within:ring-4">
          <Search size={17} className="text-utp-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar docente o área (sin importar tildes)" aria-label="Buscar docente o área" className="w-full bg-transparent text-sm outline-none" />
        </label>
        <select value={course} onChange={(e) => setCourse(e.target.value)} className="border-utp-line focus:border-utp-violet rounded-xl border bg-white px-3 py-2.5 text-sm font-medium outline-none" aria-label="Filtrar por curso">
          <option value="">Todos los cursos</option>
          {courseList.map((c) => (
            <option key={c.code} value={c.code}>
              {c.cycle !== "00" ? `Ciclo ${Number(c.cycle)} · ` : ""}
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
          const courses = [...(dir.coursesByProf.get(p.id) ?? [])].map((c) => dir.courses.get(c)?.name).filter(Boolean);
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
                  {courses.length
                    ? courses.slice(0, 4).join(", ") + (courses.length > 4 ? ` y ${courses.length - 4} más` : "")
                    : "Sin cursos asignados todavía"}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {list.length === 0 && (
        <p className="text-utp-muted py-12 text-center text-sm">
          No hay docentes con ese filtro. ¿No lo encuentras?{" "}
          <button type="button" onClick={() => setAdding(true)} className="text-utp-violet font-semibold hover:underline">
            Agrégalo para que otros puedan calificarlo
          </button>
          .
        </p>
      )}
    </div>
  );
}

/** Alta de un docente nuevo. Evita duplicados comparando el nombre normalizado (sin tildes, títulos ni orden). */
function AddProfessor({ onDone }: { onDone: () => void }) {
  const dir = useDirectory();
  const addMany = useCommunityProfessors((s) => s.addMany);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [pick, setPick] = useState("");
  const [error, setError] = useState<string | null>(null);

  const departments = useMemo(() => [...new Set([...dir.professors.values()].map((p) => p.department))].sort(), [dir.professors]);
  const courseList = useMemo(
    () => [...dir.courses.values()].sort((a, b) => a.cycle.localeCompare(b.cycle) || a.name.localeCompare(b.name)),
    [dir.courses],
  );
  const existing = useMemo(() => {
    const key = professorKey(name);
    return key.split(" ").length >= 2 ? [...dir.professors.values()].find((p) => professorKey(p.name) === key) : undefined;
  }, [name, dir.professors]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const clean = name.trim().replace(/\s+/g, " ");
    if (clean.split(" ").length < 2) return setError("Escribe nombre y apellido del docente.");
    if (existing) return setError("Ese docente ya está en la lista.");
    const dept = department.trim() || "Sin área";
    addMany([{ id: communityId(clean), name: clean, department: dept, courseCodes: codes, createdAt: new Date().toISOString(), source: "manual" }]);
    onDone();
    navigate(`/profesores/${communityId(clean)}`);
  };

  return (
    <form onSubmit={submit} className="card mt-5 grid gap-4 p-5 md:grid-cols-2">
      <div className="md:col-span-2">
        <h2 className="text-lg font-bold">Agregar un docente</h2>
        <p className="text-utp-muted mt-1 text-[13px] leading-relaxed">
          Si falta alguien de tu ciclo, agrégalo y califícalo. Si ya existe con otro orden de apellidos o sin tildes, te lo avisamos para no duplicarlo.
        </p>
      </div>
      <div>
        <label htmlFor="np-name" className="text-sm font-semibold">
          Nombre completo
        </label>
        <input id="np-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Mg. Rosa Quispe Huamán" className="field mt-1.5" maxLength={80} />
        {existing && (
          <p role="status" className="text-utp-red mt-2 text-xs font-medium">
            Ya existe:{" "}
            <Link to={`/profesores/${existing.id}`} className="underline">
              {existing.name}
            </Link>
          </p>
        )}
      </div>
      <div>
        <label htmlFor="np-dept" className="text-sm font-semibold">
          Área
        </label>
        <input id="np-dept" list="np-depts" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Ej. Computación" className="field mt-1.5" maxLength={50} />
        <datalist id="np-depts">
          {departments.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>
      </div>
      <div className="md:col-span-2">
        <label htmlFor="np-course" className="text-sm font-semibold">
          Cursos que dicta (opcional)
        </label>
        <select
          id="np-course"
          value={pick}
          onChange={(e) => {
            const v = e.target.value;
            if (v && !codes.includes(v)) setCodes([...codes, v]);
            setPick("");
          }}
          className="field mt-1.5"
        >
          <option value="">Agregar un curso…</option>
          {courseList.map((c) => (
            <option key={c.code} value={c.code}>
              {c.cycle !== "00" ? `Ciclo ${Number(c.cycle)} · ` : ""}
              {c.name}
            </option>
          ))}
        </select>
        {codes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {codes.map((c) => (
              <button key={c} type="button" onClick={() => setCodes(codes.filter((x) => x !== c))} className="bg-utp-violet-soft text-utp-violet inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
                {dir.courses.get(c)?.name ?? c} <X size={12} />
              </button>
            ))}
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="text-utp-red text-sm font-medium md:col-span-2">
          {error}
        </p>
      )}
      <div className="md:col-span-2">
        <button type="submit" className="btn btn-primary">
          Agregar y calificar
        </button>
      </div>
    </form>
  );
}
