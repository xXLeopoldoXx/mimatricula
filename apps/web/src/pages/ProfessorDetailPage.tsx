import { useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, ThumbsDown, ThumbsUp } from "lucide-react";
import type { Review, Student } from "@mimatricula/shared";
import { useAllReviews, useCatalog, useChosen, useProfessorStats } from "../lib/catalog";
import { useMyReviews } from "../store/reviews";
import NoOffer from "../components/NoOffer";
import ScoreBadge from "../components/ScoreBadge";
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
      <div className="mx-auto max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-bold">No encontramos a este docente en tu oferta</h1>
        <Link to="/profesores" className="mt-3 inline-block text-sm text-utp-violet underline">
          Ver profesores
        </Link>
      </div>
    );
  }
  const s = stats.get(id);
  const sections = catalog.offer.sections.filter((x) => x.professorId === id);
  const courseCodes = [...new Set(sections.map((x) => x.courseCode))];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <Link to="/profesores" className="inline-flex items-center gap-1 text-sm text-utp-violet hover:underline">
        <ArrowLeft size={16} /> Profesores
      </Link>

      <section className="grid gap-5 rounded-xl bg-white p-5 shadow-sm md:grid-cols-[1fr_300px] md:p-6">
        <div>
          <h1 className="text-2xl font-bold">{prof.name}</h1>
          <p className="text-sm text-utp-muted">{prof.department}</p>
          <div className="mt-3">
            <ScoreBadge stats={s} />
          </div>
          {s && (
            <div className="mt-3 flex flex-wrap gap-1">
              {s.topTags.map((t) => (
                <span key={t} className="rounded-full bg-utp-bg px-2 py-0.5 text-xs">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        {s && (
          <dl className="space-y-2">
            {CRITERIA.map(([k, label]) => (
              <div key={k}>
                <div className="flex justify-between text-xs">
                  <dt>{label}</dt>
                  <dd className="font-bold">{s[k].toFixed(1)}</dd>
                </div>
                <div className="mt-1 h-2 rounded-full bg-utp-bg">
                  <div
                    className={`h-2 rounded-full ${k === "rigor" ? "bg-utp-navy" : "bg-utp-violet"}`}
                    style={{ width: `${(s[k] / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm">
        <h2 className="border-b border-utp-line px-4 py-3 font-bold">Secciones que dicta en tu oferta</h2>
        <div className="divide-y divide-utp-line">
          {sections.map((x) => (
            <ul key={x.code}>
              <li className="bg-utp-bg/60 px-4 pt-2 text-xs font-bold text-utp-muted">{catalog.courseByCode.get(x.courseCode)?.name}</li>
              <SectionRow course={catalog.courseByCode.get(x.courseCode)!} section={x} chosen={chosen} stats={s} />
            </ul>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="rounded-xl bg-white shadow-sm">
          <h2 className="border-b border-utp-line px-4 py-3 font-bold">Reseñas ({mine.length})</h2>
          <ul className="divide-y divide-utp-line">
            {mine.map((r) => (
              <ReviewItem key={r.id} r={r} courseName={catalog.courseByCode.get(r.courseCode)?.name ?? r.courseCode} />
            ))}
            {mine.length === 0 && <li className="px-4 py-6 text-center text-sm text-utp-muted">Aún no hay reseñas.</li>}
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
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-utp-muted">
        <Stars value={overall} size={13} />
        <span>
          {courseName} · {r.term}
        </span>
        {r.wouldRecommend ? (
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <ThumbsUp size={12} /> Lo recomienda
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-utp-red">
            <ThumbsDown size={12} /> No lo recomienda
          </span>
        )}
        {r.demo ? (
          <span className="rounded bg-utp-bg px-1.5 text-[10px]">DEMO</span>
        ) : (
          <span className="rounded bg-utp-violet-soft px-1.5 text-[10px] text-utp-violet">TUYA</span>
        )}
      </div>
      <p className="mt-1 text-sm">{r.comment}</p>
      {r.tags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {r.tags.map((t) => (
            <span key={t} className="rounded-full bg-utp-bg px-2 py-0.5 text-[11px]">
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
    <form onSubmit={submit} className="h-fit rounded-xl bg-white p-4 shadow-sm">
      <h2 className="font-bold">Escribe una reseña</h2>
      <p className="text-xs text-utp-muted">
        {student.name.split(" ")[0]}, tu reseña se muestra de forma anónima para otros estudiantes.
      </p>

      {sent && (
        <p role="status" className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          ✓ ¡Gracias! Tu reseña ya cuenta en la nota del docente.
        </p>
      )}

      <label className="mt-3 block text-sm font-bold" htmlFor="rv-course">
        Curso
      </label>
      <select id="rv-course" value={course} onChange={(e) => setCourse(e.target.value)} className="mt-1 w-full rounded-md border border-utp-line bg-white px-2 py-2 text-sm">
        {courseCodes.map((c) => (
          <option key={c} value={c}>
            {catalogCourseName(c)}
          </option>
        ))}
      </select>

      <div className="mt-3 space-y-1">
        {CRITERIA.map(([k, label]) => (
          <StarInput key={k} label={label} value={scores[k]} onChange={(v) => setScores((s) => ({ ...s, [k]: v }))} />
        ))}
      </div>

      <div className="mt-3 text-sm font-bold">¿Lo recomiendas?</div>
      <div className="mt-1 grid grid-cols-2 gap-2">
        {[
          [true, "Sí"],
          [false, "No"],
        ].map(([v, label]) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => setRecommend(v as boolean)}
            className={`rounded-md border py-1.5 text-sm font-bold ${
              recommend === v ? "border-utp-violet bg-utp-violet text-white" : "border-utp-line"
            }`}
          >
            {label as string}
          </button>
        ))}
      </div>

      <div className="mt-3 text-sm font-bold">Etiquetas (opcional)</div>
      <div className="mt-1 flex flex-wrap gap-1">
        {TAG_OPTIONS.map((t) => {
          const on = tags.includes(t);
          return (
            <button
              key={t}
              type="button"
              aria-pressed={on}
              onClick={() => setTags((p) => (on ? p.filter((x) => x !== t) : p.length < 3 ? [...p, t] : p))}
              className={`rounded-full border px-2 py-0.5 text-xs ${on ? "border-utp-violet bg-utp-violet-soft text-utp-violet" : "border-utp-line"}`}
            >
              {t}
            </button>
          );
        })}
      </div>

      <label className="mt-3 block text-sm font-bold" htmlFor="rv-comment">
        Comentario
      </label>
      <textarea
        id="rv-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={800}
        rows={4}
        placeholder="¿Cómo explica? ¿Cómo evalúa? ¿Qué debería saber otro estudiante?"
        className="mt-1 w-full rounded-md border border-utp-line px-3 py-2 text-sm outline-none focus:border-utp-violet"
      />

      {error && (
        <p role="alert" className="mt-2 text-sm text-utp-red">
          {error}
        </p>
      )}
      <button type="submit" className="mt-3 w-full rounded-md bg-utp-violet py-2 text-sm font-bold text-white hover:bg-utp-violet-dark">
        Publicar reseña
      </button>
    </form>
  );
}
