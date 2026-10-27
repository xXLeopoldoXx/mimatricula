import { useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, ThumbsDown, ThumbsUp } from "lucide-react";
import type { Review, Student } from "@mimatricula/shared";
import { useAllReviews, useCatalog, useChosen, useProfessorStats } from "../lib/catalog";
import { useMyReviews } from "../store/reviews";
import NoOffer from "../components/NoOffer";
import { tierOf } from "../components/ScoreBadge";
import SectionRow from "../components/SectionRow";
import { StarInput, Stars } from "../components/Stars";

const CRITERIA = [
  ["clarity", "Claridad al explicar"],
  ["punctuality", "Puntualidad"],
  ["treatment", "Trato al estudiante"],
  ["rigor", "Exigencia"],
] as const;

const TAG_OPTIONS = [
  "Explica bien",
  "Muy paciente",
  "Puntual",
  "Clases dinámicas",
  "Buen material",
  "Justo al calificar",
  "Exigente",
  "Avanza rápido",
  "Mucha teoría",
  "Poca retroalimentación",
];

export default function ProfessorDetailPage({ student }: { student: Student }) {
  const { id = "" } = useParams();
  const catalog = useCatalog();
  const chosen = useChosen(catalog);
  const stats = useProfessorStats();
  const reviews = useAllReviews();

  const mine = useMemo(
    () => reviews.filter((r) => r.professorId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [reviews, id],
  );

  if (!catalog) return <NoOffer />;
  const prof = catalog.professorById.get(id);
  if (!prof) {
    return (
      <div className="card mx-auto max-w-md p-10 text-center">
        <h1 className="text-lg font-bold">No encontramos a este docente en tu oferta</h1>
        <Link to="/profesores" className="btn btn-primary mt-5">
          Ver profesores
        </Link>
      </div>
    );
  }
  const s = stats.get(id);
  const sections = catalog.offer.sections.filter((x) => x.professorId === id);
  const courseCodes = [...new Set(sections.map((x) => x.courseCode))];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Link to="/profesores" className="text-utp-violet inline-flex items-center gap-1.5 self-start text-sm font-semibold hover:underline">
        <ArrowLeft size={16} /> Volver a profesores
      </Link>

      <section className="bg-utp-night hourlines grid gap-8 rounded-3xl p-6 text-white md:grid-cols-[1fr_320px] md:p-10">
        <div>
          <div className="flex items-center gap-4">
            <span className="bg-utp-violet flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold">
              {prof.name
                .split(" ")
                .slice(1, 3)
                .map((w) => w[0])
                .join("")}
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-3xl leading-tight font-extrabold md:text-4xl">{prof.name}</h1>
              <p className="mt-1 text-white/65">{prof.department}</p>
            </div>
          </div>
          {s ? (
            <>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
                <span className={`font-display rounded-2xl px-4 py-2 text-5xl font-extrabold tabular-nums ${tierOf(s.overall)}`}>{s.overall.toFixed(1)}</span>
                <div className="space-y-1">
                  <Stars value={s.overall} size={20} empty="text-white/20" />
                  <p className="text-sm text-white/70">
                    {s.count} reseñas, {s.recommendPct}% lo recomienda
                  </p>
                </div>
              </div>
              {s.topTags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {s.topTags.map((t) => (
                    <span key={t} className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="mt-6 text-white/65">Este docente aún no tiene reseñas. Puedes escribir la primera.</p>
          )}
        </div>
        {s && (
          <dl className="space-y-4 self-end">
            {CRITERIA.map(([k, label]) => (
              <div key={k}>
                <div className="flex justify-between text-sm">
                  <dt className="text-white/75">{label}</dt>
                  <dd className="font-bold tabular-nums">{s[k].toFixed(1)}</dd>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/12">
                  <div className={`h-full rounded-full ${k === "rigor" ? "bg-[#fbbf24]" : "bg-[#8b6dff]"}`} style={{ width: `${(s[k] / 5) * 100}%` }} />
                </div>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="card overflow-hidden">
        <h2 className="border-utp-line border-b px-5 py-4 text-lg font-bold">Secciones que dicta en tu oferta</h2>
        <div className="divide-utp-line divide-y">
          {sections.map((x) => (
            <ul key={x.code}>
              <li className="bg-utp-bg/70 text-utp-muted px-5 py-2 text-xs font-semibold">{catalog.courseByCode.get(x.courseCode)?.name}</li>
              <SectionRow course={catalog.courseByCode.get(x.courseCode)!} section={x} chosen={chosen} stats={s} />
            </ul>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <section className="card overflow-hidden">
          <h2 className="border-utp-line border-b px-5 py-4 text-lg font-bold">Reseñas ({mine.length})</h2>
          <ul className="divide-utp-line divide-y">
            {mine.map((r) => (
              <ReviewItem key={r.id} r={r} courseName={catalog.courseByCode.get(r.courseCode)?.name ?? r.courseCode} />
            ))}
            {mine.length === 0 && <li className="text-utp-muted px-5 py-10 text-center text-sm">Aún no hay reseñas. Sé la primera persona en escribir una.</li>}
          </ul>
        </section>
        <ReviewForm professorId={id} courseCodes={courseCodes} catalogCourseName={(c) => catalog.courseByCode.get(c)?.name ?? c} student={student} />
      </div>
    </div>
  );
}

function ReviewItem({ r, courseName }: { r: Review; courseName: string }) {
  const overall = (r.clarity + r.punctuality + r.treatment) / 3;
  return (
    <li className="px-5 py-4">
      <div className="text-utp-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <Stars value={overall} size={13} />
        <span>
          {courseName} · {r.term}
        </span>
        {r.wouldRecommend ? (
          <span className="text-utp-mint inline-flex items-center gap-1 font-semibold">
            <ThumbsUp size={12} /> Lo recomienda
          </span>
        ) : (
          <span className="text-utp-red inline-flex items-center gap-1 font-semibold">
            <ThumbsDown size={12} /> No lo recomienda
          </span>
        )}
        {r.demo ? (
          <span className="bg-utp-bg rounded-md px-1.5 py-0.5 text-[10px] font-semibold">Demo</span>
        ) : (
          <span className="bg-utp-violet-soft text-utp-violet rounded-md px-1.5 py-0.5 text-[10px] font-semibold">Tuya</span>
        )}
      </div>
      <p className="mt-2 text-[15px] leading-relaxed">{r.comment}</p>
      {r.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {r.tags.map((t) => (
            <span key={t} className="bg-utp-bg rounded-full px-2.5 py-0.5 text-[11px] font-medium">
              {t}
            </span>
          ))}
        </div>
      )}
    </li>
  );
}

function ReviewForm({
  professorId,
  courseCodes,
  catalogCourseName,
  student,
}: {
  professorId: string;
  courseCodes: string[];
  catalogCourseName: (code: string) => string;
  student: Student;
}) {
  const add = useMyReviews((st) => st.add);
  const empty = { clarity: 0, rigor: 0, punctuality: 0, treatment: 0 };
  const [scores, setScores] = useState(empty);
  const [course, setCourse] = useState(courseCodes[0] ?? "");
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (Object.values(scores).some((v) => v === 0)) return setError("Califica los cuatro criterios.");
    if (recommend === null) return setError("Indica si lo recomiendas.");
    if (comment.trim().length < 15) return setError("Escribe un comentario de al menos 15 caracteres.");
    add({
      id: crypto.randomUUID(),
      professorId,
      courseCode: course,
      term: "2026-2",
      ...scores,
      wouldRecommend: recommend,
      comment: comment.trim().slice(0, 800),
      tags,
      createdAt: new Date().toISOString(),
      demo: false,
    });
    setScores(empty);
    setRecommend(null);
    setTags([]);
    setComment("");
    setError(null);
    setSent(true);
  };

  return (
    <form onSubmit={submit} className="card h-fit p-5 lg:sticky lg:top-6">
      <h2 className="text-lg font-bold">Escribe una reseña</h2>
      <p className="text-utp-muted mt-1 text-[13px] leading-relaxed">
        {student.name.split(" ")[0]}, tu reseña se muestra de forma anónima para otros estudiantes.
      </p>

      {sent && (
        <p role="status" className="bg-utp-mint-soft text-utp-mint mt-4 rounded-xl px-4 py-2.5 text-sm font-medium">
          Gracias. Tu reseña ya cuenta en la nota del docente.
        </p>
      )}

      <label className="mt-4 block text-sm font-semibold" htmlFor="rv-course">
        Curso
      </label>
      <select id="rv-course" value={course} onChange={(e) => setCourse(e.target.value)} className="field mt-1.5">
        {courseCodes.map((c) => (
          <option key={c} value={c}>
            {catalogCourseName(c)}
          </option>
        ))}
      </select>

      <div className="mt-4 space-y-1">
        {CRITERIA.map(([k, label]) => (
          <StarInput key={k} label={label} value={scores[k]} onChange={(v) => setScores((s) => ({ ...s, [k]: v }))} />
        ))}
      </div>

      <div className="mt-4 text-sm font-semibold">¿Lo recomiendas?</div>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        {[
          [true, "Sí"],
          [false, "No"],
        ].map(([v, label]) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => setRecommend(v as boolean)}
            className={`rounded-xl border py-2 text-sm font-semibold transition-colors ${
              recommend === v ? "border-utp-violet bg-utp-violet text-white" : "border-utp-line hover:border-utp-violet/40"
            }`}
          >
            {label as string}
          </button>
        ))}
      </div>

      <div className="mt-4 text-sm font-semibold">Etiquetas (opcional, hasta 3)</div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {TAG_OPTIONS.map((t) => {
          const on = tags.includes(t);
          return (
            <button
              key={t}
              type="button"
              aria-pressed={on}
              onClick={() => setTags((p) => (on ? p.filter((x) => x !== t) : p.length < 3 ? [...p, t] : p))}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${on ? "border-utp-violet bg-utp-violet-soft text-utp-violet" : "border-utp-line hover:border-utp-violet/40"}`}
            >
              {t}
            </button>
          );
        })}
      </div>

      <label className="mt-4 block text-sm font-semibold" htmlFor="rv-comment">
        Comentario
      </label>
      <textarea
        id="rv-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={800}
        rows={4}
        placeholder="¿Cómo explica? ¿Cómo evalúa? ¿Qué debería saber otro estudiante?"
        className="field mt-1.5"
      />

      {error && (
        <p role="alert" className="text-utp-red mt-3 text-sm font-medium">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary mt-4 w-full">
        Publicar reseña
      </button>
    </form>
  );
}
