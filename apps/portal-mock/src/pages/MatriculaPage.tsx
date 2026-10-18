import { useMemo, useState } from "react";
import { CheckCircle2, Info, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { Course, EnrollmentOffer, Section } from "@mimatricula/shared";
import type { useEnrollment } from "../lib/useEnrollment";
import SectionsModal from "../components/SectionsModal";

interface Props {
  offer: EnrollmentOffer;
  enrollment: ReturnType<typeof useEnrollment>;
}

const MAX_CREDITS = 22;

export default function MatriculaPage({ offer, enrollment }: Props) {
  const [open, setOpen] = useState<Course | null>(null);
  const [confirming, setConfirming] = useState(false);
  const { picks, completedAt } = enrollment;

  const sectionByCode = useMemo(() => new Map(offer.sections.map((s) => [s.code, s])), [offer]);
  const chosen = useMemo(
    () =>
      offer.courses
        .filter((c) => picks[c.code])
        .map((c) => ({ course: c, section: sectionByCode.get(picks[c.code])! }))
        .filter((x) => x.section),
    [offer, picks, sectionByCode],
  );

  const hours = round(chosen.reduce((a, x) => a + x.course.weeklyHours, 0));
  const credits = round(chosen.reduce((a, x) => a + x.course.credits, 0));
  const overCredits = credits > MAX_CREDITS;

  const select = (course: Course, section: Section) => {
    enrollment.pick(course.code, section.code);
    setOpen(null);
  };

  if (completedAt) {
    return <Completed chosen={chosen} credits={credits} onReset={enrollment.reset} />;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 pb-16 lg:flex-row lg:items-start lg:pb-0">
      <section className="min-w-0 flex-1 rounded-xl bg-white p-4 shadow-sm md:p-6">
        <h1 className="text-xl font-bold md:text-2xl">Cursos a matricular</h1>
        <p className="mt-2 text-sm text-utp-muted md:text-[15px]">
          Primero selecciona los cursos que has repetido antes de elegir uno nuevo.
        </p>

        {/* Tabla (escritorio) */}
        <div className="mt-5 hidden overflow-hidden rounded-lg border border-utp-line md:block">
          <table className="w-full text-sm" data-mm="courses-table">
            <thead className="bg-utp-head text-left text-[13px]">
              <tr>
                <th className="px-3 py-3 font-normal">Curso</th>
                <th className="px-2 py-3 text-center font-normal">
                  Horas
                  <br />
                  semanales
                </th>
                <th className="px-2 py-3 text-center font-normal">Créditos</th>
                <th className="px-2 py-3 text-center font-normal">Ciclo</th>
                <th className="px-2 py-3 font-normal">Tipo</th>
                <th className="px-2 py-3 font-normal">Sección</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {offer.courses.map((c) => {
                const sec = picks[c.code] ? sectionByCode.get(picks[c.code]) : undefined;
                return (
                  <tr
                    key={c.code}
                    className={`border-t border-utp-line ${c.repeated ? "bg-red-50/60" : ""}`}
                    data-mm="course"
                    data-course-code={c.code}
                    data-course-name={c.name}
                    data-weekly-hours={c.weeklyHours}
                    data-credits={c.credits}
                    data-cycle={c.cycle}
                    data-type={c.type}
                    data-repeated={c.repeated}
                    data-selected-section={sec?.code ?? ""}
                  >
                    <td className="px-3 py-3">
                      {c.code} - {c.name}
                      {c.repeated && (
                        <span className="ml-2 rounded bg-utp-red px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                          Repetido
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-center">{c.weeklyHours}</td>
                    <td className="px-2 py-3 text-center">{c.credits}</td>
                    <td className="px-2 py-3 text-center">{c.cycle}</td>
                    <td className="px-2 py-3">{c.type === "OBLIGATORIO" ? "Obligatorio" : "Electivo"}</td>
                    <td className="px-2 py-3 font-bold">{sec?.code ?? "--"}</td>
                    <td className="px-3 py-3 text-right">
                      <RowActions selected={!!sec} onOpen={() => setOpen(c)} onRemove={() => enrollment.remove(c.code)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Tarjetas (móvil) */}
        <ul className="mt-4 flex flex-col gap-3 md:hidden">
          {offer.courses.map((c) => {
            const sec = picks[c.code] ? sectionByCode.get(picks[c.code]) : undefined;
            return (
              <li
                key={c.code}
                className={`rounded-lg border p-3 ${c.repeated ? "border-utp-red/40 bg-red-50/60" : "border-utp-line"}`}
              >
                <div className="text-[13px] font-bold">
                  {c.code} - {c.name}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-utp-muted">
                  <span>{c.weeklyHours} h/sem</span>
                  <span>{c.credits} créditos</span>
                  <span>Ciclo {c.cycle}</span>
                  <span>{c.type === "OBLIGATORIO" ? "Obligatorio" : "Electivo"}</span>
                  {c.repeated && <span className="font-bold text-utp-red">Repetido</span>}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs">
                    Sección: <b>{sec?.code ?? "--"}</b>
                  </span>
                  <RowActions selected={!!sec} onOpen={() => setOpen(c)} onRemove={() => enrollment.remove(c.code)} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="flex w-full flex-col gap-5 lg:sticky lg:top-24 lg:w-80">
        <div className="rounded-xl bg-white p-5 shadow-sm" data-mm="summary">
          <h2 className="text-lg font-bold">Resumen</h2>
          <dl className="mt-3 space-y-1.5 text-sm text-utp-muted">
            <Row label="Cursos seleccionados" value={chosen.length} />
            <Row label="Horas semanales seleccionadas" value={hours} />
            <Row label="Créditos seleccionados" value={credits} warn={overCredits} />
          </dl>
          {overCredits && (
            <p className="mt-2 text-xs font-bold text-utp-red">Superas el máximo de {MAX_CREDITS} créditos.</p>
          )}
          <div className="mt-4 flex gap-2 rounded-lg bg-utp-head p-3 text-xs text-utp-navy">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>
              No olvides usar el botón "Completar matrícula" para registrar los cursos y horarios seleccionados.
            </span>
          </div>
          <button
            disabled={chosen.length === 0 || overCredits}
            onClick={() => setConfirming(true)}
            className="mt-4 w-full rounded-md bg-utp-violet py-2.5 text-sm font-bold text-white transition hover:bg-utp-violet-dark disabled:cursor-not-allowed disabled:bg-utp-line disabled:text-utp-muted"
          >
            Completar matrícula
          </button>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Guía de matrícula</h2>
          <p className="mt-2 text-sm text-utp-muted">Te guiamos en el proceso de matrícula en línea.</p>
          <a href="#/matricula" className="mt-2 block text-sm text-utp-navy underline">
            Videotutorial
          </a>
          <a href="#/matricula" className="mt-1 block text-sm text-utp-navy underline">
            Guía interactiva
          </a>
        </div>
      </aside>

      {/* Barra fija en móvil para no tener que bajar hasta el Resumen */}
      {chosen.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-utp-line bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] lg:hidden">
          <span className="text-sm">
            <b>{chosen.length}</b> cursos · <b>{credits}</b> créditos
          </span>
          <button
            disabled={overCredits}
            onClick={() => setConfirming(true)}
            className="rounded-md bg-utp-violet px-4 py-2 text-sm font-bold text-white disabled:bg-utp-line disabled:text-utp-muted"
          >
            Completar matrícula
          </button>
        </div>
      )}

      {open && (
        <SectionsModal
          course={open}
          offer={offer}
          picks={picks}
          onClose={() => setOpen(null)}
          onSelect={(s) => select(open, s)}
        />
      )}

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirming(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">¿Confirmas tu matrícula?</h2>
            <p className="mt-2 text-sm text-utp-muted">
              Registrarás {chosen.length} cursos y {credits} créditos. En la simulación puedes reiniciarla luego.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirming(false)} className="rounded-md border border-utp-line px-4 py-2 text-sm">
                Cancelar
              </button>
              <button
                onClick={() => {
                  enrollment.complete();
                  setConfirming(false);
                }}
                className="rounded-md bg-utp-violet px-4 py-2 text-sm font-bold text-white hover:bg-utp-violet-dark"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RowActions({ selected, onOpen, onRemove }: { selected: boolean; onOpen: () => void; onRemove: () => void }) {
  if (!selected) {
    return (
      <button
        onClick={onOpen}
        className="inline-flex items-center gap-1.5 rounded-md border border-utp-navy px-3 py-1.5 text-xs text-utp-navy transition hover:bg-utp-violet-soft"
      >
        <Plus size={14} /> Agregar
      </button>
    );
  }
  return (
    <span className="inline-flex gap-1.5">
      <button
        onClick={onOpen}
        title="Cambiar sección"
        className="inline-flex items-center gap-1 rounded-md border border-utp-navy px-2.5 py-1.5 text-xs text-utp-navy hover:bg-utp-violet-soft"
      >
        <RefreshCw size={13} /> Cambiar
      </button>
      <button
        onClick={onRemove}
        title="Quitar curso"
        aria-label="Quitar curso"
        className="inline-flex items-center rounded-md border border-utp-red/50 px-2 py-1.5 text-utp-red hover:bg-red-50"
      >
        <Trash2 size={14} />
      </button>
    </span>
  );
}

function Row({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <dt>{label}:</dt>
      <dd className={warn ? "font-bold text-utp-red" : "text-utp-ink"}>{value}</dd>
    </div>
  );
}

function Completed({
  chosen,
  credits,
  onReset,
}: {
  chosen: { course: Course; section: Section }[];
  credits: number;
  onReset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 text-center shadow-sm md:p-10">
      <CheckCircle2 className="mx-auto text-green-600" size={48} />
      <h1 className="mt-3 text-2xl font-bold">¡Matrícula registrada!</h1>
      <p className="mt-1 text-sm text-utp-muted">
        {chosen.length} cursos · {credits} créditos
      </p>
      <ul className="mt-5 divide-y divide-utp-line rounded-lg border border-utp-line text-left text-sm">
        {chosen.map(({ course, section }) => (
          <li key={course.code} className="flex justify-between gap-3 px-4 py-2.5">
            <span>{course.name}</span>
            <span className="font-bold">{section.code}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <a href="#/horario" className="rounded-md bg-utp-violet px-4 py-2 text-sm font-bold text-white hover:bg-utp-violet-dark">
          Ver mi horario
        </a>
        <button onClick={onReset} className="rounded-md border border-utp-line px-4 py-2 text-sm">
          Reiniciar simulación
        </button>
      </div>
    </div>
  );
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
