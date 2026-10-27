import { Link } from "react-router";
import { AlertTriangle, BookOpen, CalendarDays, CheckCircle2, Circle, Plus, Sparkles, Users, Wand2, type LucideIcon } from "lucide-react";
import type { Student } from "@mimatricula/shared";
import { clashWith, round2, useCatalog, useChosen, useProfessorStats, MAX_CREDITS } from "../lib/catalog";
import { useOfferStore } from "../store/offer";
import NoOffer from "../components/NoOffer";
import ScoreBadge from "../components/ScoreBadge";
import MiniWeek from "../components/MiniWeek";
import type { Chosen } from "../lib/catalog";

export default function HomePage({ student }: { student: Student }) {
  const catalog = useCatalog();
  const chosen = useChosen(catalog);
  const stats = useProfessorStats();
  const { imported, source, clear } = useOfferStore();

  const firstName = student.name.split(" ")[0] ?? student.name;

  if (!catalog || !imported) {
    return (
      <div className="flex flex-col gap-12">
        <Hero name={firstName} chosen={[]} clashes={0} hasOffer={false} />
        <NoOffer />
        <Pillars />
        <Faq />
      </div>
    );
  }

  const credits = round2(chosen.reduce((a, c) => a + c.course.credits, 0));
  const clashes = chosen.filter((c) => clashWith(c.section, chosen, c.course.code)).length;
  const over = credits > MAX_CREDITS;

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
    <div className="flex flex-col gap-10">
      <Hero name={firstName} chosen={chosen} clashes={clashes} hasOffer />

      <section className="card bg-utp-line grid grid-cols-2 gap-px overflow-hidden lg:grid-cols-4" aria-label="Resumen de tu matrícula">
        <Stat icon={BookOpen} value={`${chosen.length}`} suffix={`de ${catalog.offer.courses.length}`} label="Cursos elegidos" />
        <Stat icon={CalendarDays} value={`${credits}`} suffix={`de ${MAX_CREDITS}`} label="Créditos" warn={over} bar={Math.min(100, (credits / MAX_CREDITS) * 100)} />
        <Stat icon={AlertTriangle} value={`${clashes}`} label={clashes === 1 ? "Curso con cruce" : "Cursos con cruce"} warn={clashes > 0} />
        <Stat icon={Users} value={`${catalog.offer.professors.length}`} label="Docentes en tu oferta" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="card p-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold">Docentes mejor evaluados</h2>
              <p className="text-utp-muted mt-0.5 text-sm">Según las reseñas de otros estudiantes.</p>
            </div>
            <Link to="/profesores" className="text-utp-violet text-sm font-semibold hover:underline">
              Ver todos
            </Link>
          </div>
          <ol className="divide-utp-line mt-3 divide-y">
            {top.map(({ p, s }, i) => (
              <li key={p.id}>
                <Link to={`/profesores/${p.id}`} className="hover:bg-utp-bg -mx-3 flex items-center gap-4 rounded-xl px-3 py-3.5 transition-colors">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${i === 0 ? "bg-utp-orange text-white" : "bg-utp-bg text-utp-muted"}`}>
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{p.name}</span>
                    <span className="text-utp-muted block truncate text-xs">{p.department}</span>
                  </span>
                  <ScoreBadge stats={s} compact />
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <aside className="flex flex-col gap-6">
          <section className="card p-6">
            <h2 className="text-xl font-bold">Tu avance</h2>
            <ul className="mt-4 space-y-3">
              {steps.map((s) => (
                <li key={s.label}>
                  <Link to={s.to} className="flex items-center gap-3 text-sm font-medium">
                    {s.done ? <CheckCircle2 size={20} className="text-utp-mint shrink-0" /> : <Circle size={20} className="text-utp-line shrink-0" strokeWidth={2.5} />}
                    <span className={s.done ? "text-utp-muted" : ""}>{s.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/recomendaciones" className="btn btn-soft mt-5 w-full">
              <Sparkles size={16} /> Ver recomendaciones
            </Link>
          </section>

          <section className="card p-6 text-sm">
            <h2 className="text-xl font-bold">Oferta {imported.offer.term}</h2>
            <p className="text-utp-muted mt-2 leading-relaxed">
              {source === "demo" ? "Datos de demostración" : "Importada con la extensión"} el {new Date(imported.extractedAt).toLocaleString("es-PE")}.
            </p>
            <p className="text-utp-muted mt-1">
              {catalog.offer.courses.length} cursos y {catalog.offer.sections.length} secciones.
            </p>
            <button onClick={clear} className="text-utp-red mt-4 text-xs font-semibold hover:underline">
              Borrar oferta e importar otra
            </button>
          </section>
        </aside>
      </div>

      <Pillars />
      <Faq />
    </div>
  );
}

function Hero({ name, chosen, clashes, hasOffer }: { name: string; chosen: Chosen[]; clashes: number; hasOffer: boolean }) {
  const title = !hasOffer
    ? `${name}, vamos a armar tu matrícula.`
    : chosen.length === 0
      ? `${name}, elige tus primeras secciones.`
      : clashes > 0
        ? `${name}, tienes cruces por resolver.`
        : `${name}, tu horario va tomando forma.`;
  const text = !hasOffer
    ? "Importa tu oferta y compara a cada docente con lo que opinan otros estudiantes."
    : chosen.length === 0
      ? "Mira lo que opinan otros estudiantes de cada docente, o deja que el generador te proponga tres horarios sin cruces."
      : clashes > 0
        ? "Cambia una de las secciones que se superponen y tu semana quedará despejada."
        : "Sin cruces y dentro del límite de créditos. Revisa tu semana o pídele al generador una alternativa.";

  return (
    <section className="bg-utp-night blob hourlines relative overflow-hidden rounded-[2.5rem] p-6 text-white md:p-14">
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold">
            <span className="bg-utp-green h-2 w-2 rounded-full" /> Matrícula 2027 abierta
          </span>
          <h1 className="font-display mt-5 text-4xl leading-[1.05] font-extrabold md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/75">{text}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            {hasOffer ? (
              <>
                <Link to="/generador" className="btn btn-accent px-6 py-3.5">
                  <Wand2 size={18} /> Generar mi horario
                </Link>
                <Link to={chosen.length ? "/horario" : "/cursos"} className="btn btn-on-dark px-6 py-3.5">
                  {chosen.length ? "Ver mi horario" : "Explorar cursos"}
                </Link>
              </>
            ) : (
              <Link to="/profesores" className="btn btn-accent px-6 py-3.5">
                <Users size={18} /> Explorar docentes
              </Link>
            )}
          </div>
          <dl className="mt-9 grid max-w-md grid-cols-3 gap-4 border-t border-white/15 pt-6">
            {[["+500", "reseñas"], ["3", "horarios sin cruces"], ["0", "minutos perdidos"]].map(([v, l]) => (
              <div key={l}>
                <dt className="font-display text-2xl font-extrabold">{v}</dt>
                <dd className="text-xs text-white/60">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur md:p-5">
          <MiniWeek chosen={chosen} />
          <p className="mt-3 text-xs text-white/60">{chosen.length ? "Así se ve tu semana con las secciones que elegiste." : "Aquí aparecerán tus clases cuando elijas secciones."}</p>
        </div>
      </div>
    </section>
  );
}

const PILLARS = [
  { n: "1", icon: Users, title: "Reseñas reales", text: "Opiniones de estudiantes sobre claridad, exigencia y trato de cada docente.", bg: "bg-utp-violet" },
  { n: "2", icon: CalendarDays, title: "Horario sin cruces", text: "El generador prueba combinaciones y te propone alternativas listas para matricular.", bg: "bg-utp-orange" },
  { n: "3", icon: Sparkles, title: "Tiempo ahorrado", text: "Deja de buscar opiniones en grupos y foros: todo está en un solo lugar.", bg: "bg-utp-green" },
];

function Pillars() {
  return (
    <section aria-labelledby="why" className="py-4">
      <span className="eyebrow">Por qué elegirnos</span>
      <h2 id="why" className="font-display mt-2 text-3xl font-extrabold md:text-4xl">Decide con información, no con suerte.</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {PILLARS.map((p) => (
          <article key={p.title} className={`${p.bg} relative overflow-hidden rounded-[2rem] p-7 text-white transition-transform hover:-translate-y-1`}>
            <span className="font-display absolute -top-4 right-3 text-[7rem] leading-none font-extrabold text-white/15" aria-hidden="true">{p.n}</span>
            <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20"><p.icon size={22} /></span>
            <h3 className="relative mt-6 text-xl font-extrabold">{p.title}</h3>
            <p className="relative mt-2 text-sm leading-relaxed text-white/90">{p.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const FAQS = [
  ["¿Cómo importo mi oferta de matrícula?", "Con la extensión del navegador: abre el portal, pulsa Extraer oferta y luego Enviar a MiMatrícula. También puedes usar los datos de demostración."],
  ["¿Cómo se calcula la puntuación de un docente?", "Combina las calificaciones de las reseñas y pondera por la cantidad de opiniones, para que un solo comentario no domine el resultado."],
  ["¿El generador respeta el límite de créditos?", "Sí. Solo propone horarios sin cruces y dentro del máximo de créditos; puedes ajustar tus preferencias de turno y docentes."],
  ["¿Mis datos se guardan en algún servidor?", "En esta versión de demostración la selección y las preferencias se guardan en tu propio navegador."],
];

function Faq() {
  return (
    <section aria-labelledby="faq" className="grid gap-8 py-4 lg:grid-cols-[1fr_1.4fr]">
      <div>
        <span className="eyebrow">¿Quieres saber más?</span>
        <h2 id="faq" className="font-display mt-2 text-3xl font-extrabold md:text-4xl">Resuelve tus dudas aquí.</h2>
        <p className="text-utp-muted mt-3 text-[15px] leading-relaxed">Lo esencial para empezar a matricularte con confianza.</p>
      </div>
      <div className="card divide-utp-line divide-y px-6">
        {FAQS.map(([q, a]) => (
          <details key={q} className="faq">
            <summary>
              {q}
              <Plus size={20} className="text-utp-orange shrink-0 transition-transform" />
            </summary>
            <p className="text-utp-muted pb-5 text-sm leading-relaxed">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Stat({ icon: Icon, value, suffix, label, warn, bar }: { icon: LucideIcon; value: string; suffix?: string; label: string; warn?: boolean; bar?: number }) {
  return (
    <div className="bg-white p-5">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${warn ? "bg-utp-red/10 text-utp-red" : "bg-utp-violet-soft text-utp-violet"}`}>
          <Icon size={17} />
        </span>
        <span className="text-utp-muted text-sm font-medium">{label}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className={`font-display text-4xl font-bold tabular-nums ${warn ? "text-utp-red" : ""}`}>{value}</span>
        {suffix && <span className="text-utp-muted text-sm">{suffix}</span>}
      </div>
      {bar !== undefined && (
        <div className="bg-utp-bg mt-3 h-1.5 overflow-hidden rounded-full">
          <div className={`h-full rounded-full ${warn ? "bg-utp-red" : "bg-utp-violet"}`} style={{ width: `${bar}%` }} />
        </div>
      )}
    </div>
  );
}
