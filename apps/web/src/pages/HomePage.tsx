import { Link } from "react-router";
import { AlertTriangle, BookOpen, CalendarDays, CheckCircle2, Circle, Sparkles, Users } from "lucide-react";
import type { Student } from "@mimatricula/shared";
import { clashWith, round2, useCatalog, useChosen, useProfessorStats, MAX_CREDITS } from "../lib/catalog";
import { useOfferStore } from "../store/offer";
import NoOffer from "../components/NoOffer";
import ScoreBadge from "../components/ScoreBadge";

export default function HomePage({ student }: { student: Student }) {
  const catalog = useCatalog();
  const chosen = useChosen(catalog);
  const stats = useProfessorStats();
  const { imported, source, clear } = useOfferStore();

  const firstName = student.name.split(" ")[0];

  if (!catalog || !imported) {
    return (
      <div className="flex flex-col gap-5">
        <Welcome name={firstName} />
        <NoOffer />
      </div>
    );
  }

  const credits = round2(chosen.reduce((a, c) => a + c.course.credits, 0));
  const clashes = chosen.filter((c) => clashWith(c.section, chosen, c.course.code)).length;

  const top = catalog.offer.professors
    .map((p) => ({ p, s: stats.get(p.id) }))
    .filter((x) => x.s)
    .sort((a, b) => b.s!.score - a.s!.score)
    .slice(0, 5);

  const steps = [
    { done: true, label: "Importar tu oferta", to: "/cursos" },
    { done: chosen.length > 0, label: "Elegir secciones", to: "/cursos" },
    { done: chosen.length > 0 && clashes === 0, label: "Revisar tu horario sin cruces", to: "/horario" },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <Welcome name={firstName} />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile icon={BookOpen} value={`${chosen.length} / ${catalog.offer.courses.length}`} label="Cursos elegidos" />
        <Tile
          icon={CalendarDays}
          value={`${credits}`}
          label={`Créditos (máx. ${MAX_CREDITS})`}
          warn={credits > MAX_CREDITS}
        />
        <Tile icon={AlertTriangle} value={`${clashes}`} label="Cursos con cruce" warn={clashes > 0} />
        <Tile icon={Users} value={`${catalog.offer.professors.length}`} label="Docentes en tu oferta" />
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Docentes mejor evaluados</h2>
            <Link to="/profesores" className="text-sm text-utp-violet underline">
              Ver todos
            </Link>
          </div>
          <ol className="mt-3 divide-y divide-utp-line">
            {top.map(({ p, s }, i) => (
              <li key={p.id}>
                <Link to={`/profesores/${p.id}`} className="flex items-center gap-3 py-3 hover:bg-utp-bg/60">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? "bg-utp-red text-white" : "bg-utp-bg"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{p.name}</span>
                    <span className="block text-xs text-utp-muted">{p.department}</span>
                  </span>
                  <ScoreBadge stats={s} compact />
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <aside className="flex flex-col gap-5">
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Tus pasos</h2>
            <ul className="mt-3 space-y-2">
              {steps.map((s) => (
                <li key={s.label}>
                  <Link to={s.to} className="flex items-center gap-2 text-sm">
                    {s.done ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Circle size={18} className="text-utp-line" />}
                    <span className={s.done ? "text-utp-muted line-through" : ""}>{s.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              to="/recomendaciones"
              className="mt-4 flex items-center justify-center gap-2 rounded-md bg-utp-violet py-2.5 text-sm font-bold text-white hover:bg-utp-violet-dark"
            >
              <Sparkles size={16} /> Ver recomendaciones
            </Link>
          </section>

          <section className="rounded-xl bg-white p-5 text-sm shadow-sm">
            <h2 className="text-lg font-bold">Oferta {imported.offer.term}</h2>
            <p className="mt-1 text-utp-muted">
              {source === "demo" ? "Datos de demostración" : "Importada con la extensión"} el{" "}
              {new Date(imported.extractedAt).toLocaleString("es-PE")}.
            </p>
            <p className="mt-1 text-utp-muted">
              {catalog.offer.courses.length} cursos · {catalog.offer.sections.length} secciones
            </p>
            <button onClick={clear} className="mt-3 text-xs text-utp-red underline">
              Borrar oferta e importar otra
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Welcome({ name }: { name: string }) {
  return (
    <section className="rounded-xl bg-utp-navy p-6 text-white shadow-sm md:p-8">
      <p className="text-xs font-bold tracking-widest text-white/70 uppercase">Periodo de matrícula</p>
      <h1 className="mt-1 text-2xl font-black md:text-3xl">Hola, {name} 👋</h1>
      <p className="mt-2 max-w-xl text-sm text-white/80">
        Elige tus secciones mirando lo que opinan otros estudiantes de cada docente, y arma un horario sin cruces.
      </p>
    </section>
  );
}

function Tile({ icon: Icon, value, label, warn }: { icon: typeof BookOpen; value: string; label: string; warn?: boolean }) {
  return (
    <div className={`rounded-xl border-t-4 bg-white p-4 shadow-sm ${warn ? "border-utp-red" : "border-utp-violet"}`}>
      <Icon size={18} className={warn ? "text-utp-red" : "text-utp-violet"} />
      <div className={`mt-2 text-2xl font-black ${warn ? "text-utp-red" : ""}`}>{value}</div>
      <div className="text-xs text-utp-muted">{label}</div>
    </div>
  );
}
