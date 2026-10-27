import { useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import {
  AlertTriangle,
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  Coffee,
  GraduationCap,
  Loader2,
  Minus,
  Moon,
  Plus,
  Scale,
  Sun,
  Sunrise,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { DAY_LABEL, DAY_SHORT, fromMinutes, toMinutes, type BusyBlock, type Day, type TimeBand } from "@mimatricula/shared";
import type { GenerateResult, ScheduleOption } from "@mimatricula/scheduler";
import { useCatalog, useProfessorStats, MAX_CREDITS, round2 } from "../lib/catalog";
import { usePreferences } from "../store/preferences";
import { useSelection } from "../store/selection";
import { useGenerator } from "../generator/useGenerator";
import NoOffer from "../components/NoOffer";
import WeekGrid from "../components/WeekGrid";

const STEPS = ["Turno", "Trabajo", "Límites", "Resumen"];
const WEEK: Day[] = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];
const HOURS = Array.from({ length: 16 }, (_, i) => 7 + i); // celdas de 7:00 a 23:00

const BANDS: { id: TimeBand; label: string; hours: string; icon: LucideIcon }[] = [
  { id: "MANANA", label: "Mañana", hours: "7:00 a 12:00", icon: Sunrise },
  { id: "TARDE", label: "Tarde", hours: "12:00 a 18:00", icon: Sun },
  { id: "NOCHE", label: "Noche", hours: "18:00 a 23:00", icon: Moon },
];

const PRIORITIES: { value: number; label: string; detail: string; icon: LucideIcon }[] = [
  { value: 0.85, label: "Mejores docentes", detail: "Aunque tenga que ir más días", icon: GraduationCap },
  { value: 0.6, label: "Equilibrado", detail: "Buenos docentes y buen horario", icon: Scale },
  { value: 0.3, label: "Horario cómodo", detail: "Menos días y sin horas muertas", icon: Coffee },
];

const WORK_PRESETS: { label: string; days: Day[]; start: string; end: string }[] = [
  { label: "Lun a Vie, 8:00 a 17:00", days: ["LUN", "MAR", "MIE", "JUE", "VIE"], start: "08:00", end: "17:00" },
  { label: "Lun a Vie, 9:00 a 18:00", days: ["LUN", "MAR", "MIE", "JUE", "VIE"], start: "09:00", end: "18:00" },
  { label: "Medio tiempo, 8:00 a 13:00", days: ["LUN", "MAR", "MIE", "JUE", "VIE"], start: "08:00", end: "13:00" },
  { label: "Medio tiempo, 14:00 a 19:00", days: ["LUN", "MAR", "MIE", "JUE", "VIE"], start: "14:00", end: "19:00" },
  { label: "Sábados, 8:00 a 14:00", days: ["SAB"], start: "08:00", end: "14:00" },
];

const BUDGET_CHIPS = [600, 815, 1000, 1500];

/** Asistente de 4 pasos con botones + generador de las 3 mejores combinaciones. */
export default function GeneratorPage() {
  const catalog = useCatalog();
  const stats = useProfessorStats();
  const prefs = usePreferences((s) => s.prefs);
  const gen = useGenerator();
  const [step, setStep] = useState(0);
  const top = useRef<HTMLDivElement>(null);

  if (!catalog) return <NoOffer />;

  const go = (n: number) => {
    setStep(n);
    gen.clear();
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const problem = [
    prefs.bands.length ? null : "Elige al menos un turno.",
    prefs.works && !prefs.busy.length ? "Marca tus horas de trabajo o elige un horario típico." : null,
    null,
    null,
  ][step];

  const generate = () =>
    gen.run({ offer: catalog.offer, stats, prefs, maxCredits: MAX_CREDITS });

  const cheapest = Math.min(...catalog.offer.courses.map((c) => c.credits)) * prefs.costPerCreditPen;

  return (
    <div ref={top} className="mx-auto flex max-w-5xl scroll-mt-24 flex-col gap-6">
      <div>
        <h1 className="page-title flex items-center gap-3">
          <span className="bg-utp-violet flex h-11 w-11 items-center justify-center rounded-xl text-white">
            <Wand2 size={22} />
          </span>
          Generador de horarios
        </h1>
        <p className="page-lead">
          Responde con botones y armamos tus mejores horarios sin cruces, con los docentes mejor evaluados.
        </p>
      </div>

      <Stepper step={gen.result ? 4 : step} onGo={go} />

      {gen.result ? (
        <Results result={gen.result} onEdit={() => go(0)} />
      ) : (
        <section className="card p-6 md:p-8">
          {step === 0 && <StepShift />}
          {step === 1 && <StepWork />}
          {step === 2 && <StepLimits cheapest={cheapest} />}
          {step === 3 && <StepSummary onEdit={go} />}

          {problem && (
            <p role="alert" className="bg-utp-red/8 text-utp-red-dark mt-5 rounded-xl px-4 py-2.5 text-sm font-medium">
              {problem}
            </p>
          )}

          <div className="border-utp-line mt-8 flex items-center justify-between gap-3 border-t pt-5">
            <button
              onClick={() => go(step - 1)}
              disabled={step === 0}
              className="btn text-utp-muted hover:bg-utp-bg disabled:invisible"
            >
              <ChevronLeft size={16} /> Atrás
            </button>
            {step < 3 ? (
              <button
                onClick={() => go(step + 1)}
                disabled={!!problem}
                className="btn btn-primary px-6"
              >
                Siguiente <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={generate}
                disabled={gen.running || !prefs.bands.length}
                className="btn btn-accent px-6"
              >
                {gen.running ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                {gen.running ? "Generando…" : "Generar mis horarios"}
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Stepper({ step, onGo }: { step: number; onGo: (n: number) => void }) {
  return (
    <ol className="grid grid-cols-4">
      {STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li key={label} className="relative">
            {i > 0 && <span className={`absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2 ${i <= step ? "bg-utp-violet" : "bg-utp-line"}`} aria-hidden="true" />}
            <button
              onClick={() => onGo(i)}
              disabled={i > step}
              aria-current={active ? "step" : undefined}
              className="relative flex w-full flex-col items-center gap-2 text-sm font-semibold disabled:cursor-default"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  done ? "bg-utp-violet text-white" : active ? "bg-utp-violet ring-utp-violet/20 text-white ring-4" : "bg-white text-utp-muted border-utp-line border-2"
                }`}
              >
                {done ? <Check size={16} /> : i + 1}
              </span>
              <span className={active ? "text-utp-violet" : done ? "text-utp-ink" : "text-utp-muted"}>{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function Question({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="mb-8 last:mb-0">
      <legend className="font-display text-xl font-bold">{title}</legend>
      {hint && <p className="text-utp-muted mt-1 text-sm">{hint}</p>}
      <div className="mt-4">{children}</div>
    </fieldset>
  );
}

function Choice({
  active,
  onClick,
  icon: Icon,
  label,
  detail,
}: {
  active: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  label: string;
  detail?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`relative flex items-center gap-3.5 rounded-2xl border-2 p-4 text-left transition-colors ${
        active ? "border-utp-violet bg-utp-violet-soft" : "border-utp-line bg-white hover:border-utp-violet/40"
      }`}
    >
      {Icon && (
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${active ? "bg-utp-violet text-white" : "bg-utp-bg text-utp-muted"}`}>
          <Icon size={22} />
        </span>
      )}
      <span className="min-w-0">
        <b className="block">{label}</b>
        {detail && <span className="block text-xs text-utp-muted">{detail}</span>}
      </span>
      {active && <Check size={18} className="text-utp-violet absolute top-3 right-3" />}
    </button>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
        active ? "border-utp-violet bg-utp-violet text-white" : "border-utp-line bg-white text-utp-ink hover:border-utp-violet/50"
      }`}
    >
      {children}
    </button>
  );
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function StepShift() {
  const { prefs, set } = usePreferences();
  return (
    <>
      <Question title="¿En qué turnos puedes estudiar?" hint="Puedes elegir varios. Solo usaremos secciones en esos turnos.">
        <div className="grid gap-3 sm:grid-cols-3">
          {BANDS.map((b) => (
            <Choice
              key={b.id}
              active={prefs.bands.includes(b.id)}
              onClick={() => set({ bands: toggle(prefs.bands, b.id) })}
              icon={b.icon}
              label={b.label}
              detail={b.hours}
            />
          ))}
        </div>
      </Question>
      <Question title="¿Quieres algún día libre?" hint="Opcional. No pondremos clases esos días.">
        <div className="flex flex-wrap gap-2">
          {WEEK.map((d) => (
            <Chip key={d} active={prefs.freeDays.includes(d)} onClick={() => set({ freeDays: toggle(prefs.freeDays, d) })}>
              {DAY_LABEL[d]}
            </Chip>
          ))}
        </div>
      </Question>
    </>
  );
}

/** Horas ocupadas (inicio de cada celda de 1 h) por día, a partir de los bloques. */
function cellsOf(busy: BusyBlock[]): Set<string> {
  const out = new Set<string>();
  for (const b of busy)
    for (const h of HOURS) if (h * 60 < toMinutes(b.end) && (h + 1) * 60 > toMinutes(b.start)) out.add(`${b.day}-${h}`);
  return out;
}

/** Junta las celdas seguidas de cada día en bloques. */
function blocksOf(cells: Set<string>): BusyBlock[] {
  const out: BusyBlock[] = [];
  for (const day of WEEK) {
    let start: number | null = null;
    for (const h of [...HOURS, HOURS[HOURS.length - 1]! + 1]) {
      const on = cells.has(`${day}-${h}`);
      if (on && start === null) start = h;
      if (!on && start !== null) {
        out.push({ day, start: fromMinutes(start * 60), end: fromMinutes(h * 60), label: "Trabajo" });
        start = null;
      }
    }
  }
  return out;
}

function StepWork() {
  const { prefs, set } = usePreferences();
  const cells = useMemo(() => cellsOf(prefs.busy), [prefs.busy]);
  const painting = useRef<boolean | null>(null);

  const paint = (key: string, on: boolean) => {
    const next = new Set(cells);
    if (on) next.add(key);
    else next.delete(key);
    set({ busy: blocksOf(next) });
  };

  const applyPreset = (p: (typeof WORK_PRESETS)[number]) =>
    set({ busy: p.days.map((day) => ({ day, start: p.start, end: p.end, label: "Trabajo" })) });

  return (
    <>
      <Question title="¿Trabajas o tienes horas ocupadas fijas?">
        <div className="grid gap-3 sm:grid-cols-2">
          <Choice active={prefs.works} onClick={() => set({ works: true })} icon={Briefcase} label="Sí, trabajo" detail="Marca tus horas y no pondremos clases ahí" />
          <Choice active={!prefs.works} onClick={() => set({ works: false })} icon={GraduationCap} label="No, solo estudio" detail="Usaremos cualquier hora de tus turnos" />
        </div>
      </Question>

      {prefs.works && (
        <>
          <Question title="Elige un horario típico" hint="Luego puedes ajustarlo en la grilla.">
            <div className="flex flex-wrap gap-2">
              {WORK_PRESETS.map((p) => (
                <Chip key={p.label} active={false} onClick={() => applyPreset(p)}>
                  {p.label}
                </Chip>
              ))}
            </div>
          </Question>

          <Question title="Tus horas ocupadas" hint="Toca las horas para marcarlas o desmarcarlas. En computadora puedes arrastrar.">
            <div className="overflow-x-auto" onPointerUp={() => (painting.current = null)} onPointerLeave={() => (painting.current = null)}>
              <table className="w-full min-w-[420px] border-separate border-spacing-0.5 text-xs select-none">
                <thead>
                  <tr>
                    <th className="w-12" />
                    {WEEK.map((d) => (
                      <th key={d} className="pb-1 font-bold">
                        {DAY_SHORT[d]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HOURS.map((h) => (
                    <tr key={h}>
                      <td className="pr-1 text-right text-utp-muted">{String(h).padStart(2, "0")}:00</td>
                      {WEEK.map((d) => {
                        const key = `${d}-${h}`;
                        const on = cells.has(key);
                        return (
                          <td key={d} className="p-0">
                            <button
                              aria-label={`${DAY_LABEL[d]} ${h}:00`}
                              aria-pressed={on}
                              data-cell={key}
                              onPointerDown={(e) => {
                                e.preventDefault();
                                painting.current = !on;
                                paint(key, !on);
                              }}
                              onPointerEnter={() => painting.current !== null && painting.current !== on && paint(key, painting.current)}
                              className={`block h-6 w-full rounded-md ${on ? "bg-utp-violet" : "bg-utp-bg hover:bg-utp-violet-soft"}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-utp-muted">
              <span>
                {prefs.busy.length
                  ? `${round2(prefs.busy.reduce((a, b) => a + toMinutes(b.end) - toMinutes(b.start), 0) / 60)} h ocupadas a la semana`
                  : "Aún no marcas horas."}
              </span>
              {prefs.busy.length > 0 && (
                <button onClick={() => set({ busy: [] })} className="text-utp-red underline">
                  Borrar todo
                </button>
              )}
            </div>
          </Question>

          <Question title="¿Cuánto tiempo necesitas para llegar?" hint="Dejaremos ese margen libre antes y después del trabajo.">
            <div className="flex flex-wrap gap-2">
              {[0, 30, 60, 90].map((m) => (
                <Chip key={m} active={prefs.bufferMin === m} onClick={() => set({ bufferMin: m })}>
                  {m === 0 ? "Nada" : `${m} min`}
                </Chip>
              ))}
            </div>
          </Question>
        </>
      )}
    </>
  );
}

function StepLimits({ cheapest }: { cheapest: number }) {
  const { prefs, set } = usePreferences();
  const credits = prefs.budgetPen == null ? null : Math.min(MAX_CREDITS, prefs.budgetPen / prefs.costPerCreditPen);
  return (
    <>
      <Question title="¿Cuántos cursos como máximo?">
        <div className="flex items-center gap-3">
          <button
            aria-label="Menos cursos"
            onClick={() => set({ maxCourses: Math.max(1, prefs.maxCourses - 1) })}
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-utp-line hover:border-utp-violet"
          >
            <Minus size={18} />
          </button>
          <span className="font-display w-16 text-center text-4xl font-bold" aria-live="polite">
            {prefs.maxCourses}
          </span>
          <button
            aria-label="Más cursos"
            onClick={() => set({ maxCourses: Math.min(10, prefs.maxCourses + 1) })}
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-utp-line hover:border-utp-violet"
          >
            <Plus size={18} />
          </button>
          <span className="text-sm text-utp-muted">cursos (y hasta {MAX_CREDITS} créditos)</span>
        </div>
      </Question>

      <Question title="¿Tienes un presupuesto?" hint="El costo se calcula por crédito. El precio es un dato de ejemplo: cámbialo por el de tu escala.">
        <div className="flex flex-wrap gap-2">
          <Chip active={prefs.budgetPen == null} onClick={() => set({ budgetPen: null })}>
            Sin límite
          </Chip>
          {BUDGET_CHIPS.map((b) => (
            <Chip key={b} active={prefs.budgetPen === b} onClick={() => set({ budgetPen: b })}>
              S/ {b}
            </Chip>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="font-bold">Otro monto (S/)</span>
            <input
              type="number"
              min={1}
              inputMode="decimal"
              value={prefs.budgetPen ?? ""}
              placeholder="Sin límite"
              onChange={(e) => set({ budgetPen: e.target.value ? Math.max(1, Number(e.target.value)) : null })}
              className="field mt-1.5"
            />
          </label>
          <label className="text-sm">
            <span className="font-bold">Precio por crédito (S/)</span>
            <input
              type="number"
              min={1}
              inputMode="decimal"
              value={prefs.costPerCreditPen}
              onChange={(e) => set({ costPerCreditPen: Math.max(1, Number(e.target.value) || 1) })}
              className="field mt-1.5"
            />
          </label>
        </div>
        {credits != null && (
          <p className={`mt-3 text-sm ${prefs.budgetPen! < cheapest ? "text-utp-red font-semibold" : "text-utp-muted"}`}>
            {prefs.budgetPen! < cheapest
              ? `No alcanza ni para el curso más barato (S/ ${cheapest.toFixed(2)}).`
              : `Te alcanza para ${round2(credits)} créditos.`}
          </p>
        )}
      </Question>

      <Question title="¿Qué es más importante para ti?">
        <div className="grid gap-3 sm:grid-cols-3">
          {PRIORITIES.map((p) => (
            <Choice
              key={p.value}
              active={Math.abs(prefs.professorWeight - p.value) < 0.01}
              onClick={() => set({ professorWeight: p.value })}
              icon={p.icon}
              label={p.label}
              detail={p.detail}
            />
          ))}
        </div>
      </Question>
    </>
  );
}

function StepSummary({ onEdit }: { onEdit: (step: number) => void }) {
  const { prefs } = usePreferences();
  const rows: [string, string, number][] = [
    ["Turnos", prefs.bands.map((b) => BANDS.find((x) => x.id === b)!.label).join(", ") || "Ninguno", 0],
    ["Días libres", prefs.freeDays.map((d) => DAY_LABEL[d]).join(", ") || "Ninguno", 0],
    [
      "Trabajo",
      prefs.works
        ? `${prefs.busy.length} ${prefs.busy.length === 1 ? "bloque" : "bloques"} ocupados, ${prefs.bufferMin} min para llegar`
        : "No trabajo",
      1,
    ],
    ["Máximo de cursos", `${prefs.maxCourses}`, 2],
    [
      "Presupuesto",
      prefs.budgetPen == null ? "Sin límite" : `S/ ${prefs.budgetPen} (S/ ${prefs.costPerCreditPen} por crédito)`,
      2,
    ],
    ["Prioridad", PRIORITIES.find((p) => Math.abs(p.value - prefs.professorWeight) < 0.01)?.label ?? "Equilibrado", 2],
  ];
  return (
    <Question title="Revisa tus respuestas" hint="Los cursos repetidos van primero y luego los obligatorios.">
      <dl className="divide-utp-line border-utp-line divide-y overflow-hidden rounded-2xl border">
        {rows.map(([k, v, s]) => (
          <div key={k} className="flex items-center gap-3 px-5 py-3 text-sm">
            <dt className="text-utp-muted w-36 shrink-0 font-medium">{k}</dt>
            <dd className="min-w-0 flex-1 font-semibold">{v}</dd>
            <button onClick={() => onEdit(s)} className="text-utp-violet text-xs font-semibold hover:underline">
              Editar
            </button>
          </div>
        ))}
      </dl>
    </Question>
  );
}

const LETTERS = ["A", "B", "C"];

function Results({ result, onEdit }: { result: GenerateResult; onEdit: () => void }) {
  const [active, setActive] = useState(0);
  const { prefs } = usePreferences();
  const replaceAll = useSelection((s) => s.replaceAll);
  const navigate = useNavigate();

  if (!result.options.length) {
    return (
      <section className="card p-8">
        <AlertTriangle className="text-utp-red" />
        <h2 className="mt-2 text-lg font-bold">No encontramos un horario que cumpla todo</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {[...result.tips, ...result.left.slice(0, 4).map((l) => `${l.course.name}: ${l.reason}`)].map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <button onClick={onEdit} className="btn btn-primary mt-5">
          Cambiar mis preferencias
        </button>
      </section>
    );
  }

  const option = result.options[active] ?? result.options[0]!;
  const use = (o: ScheduleOption) => {
    replaceAll(Object.fromEntries(o.picks.map((p) => [p.course.code, p.section.code])));
    navigate("/horario");
  };
  const chosen = option.picks.map((p) => ({ course: p.course, section: p.section }));

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="grid grid-cols-3 gap-2">
        {result.options.map((o, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`shadow-soft rounded-2xl border-2 bg-white p-4 text-left transition-colors ${i === active ? "border-utp-violet" : "border-transparent hover:border-utp-violet/30"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-1">
              <b className="font-display text-base">Opción {LETTERS[i]}</b>
              {i === 0 && <span className="bg-utp-red rounded-full px-2 py-0.5 text-[11px] font-bold text-white">Mejor</span>}
            </div>
            <div className="text-utp-muted mt-1 text-xs">
              {o.picks.length} cursos<span className="hidden sm:inline"> · {o.credits} créditos</span> · {o.days.length} días
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-utp-bg" title="Puntaje">
              <div className="h-full bg-utp-violet" style={{ width: `${Math.round(o.total * 100)}%` }} />
            </div>
          </button>
        ))}
      </div>

      <section className="card p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Opción {LETTERS[active]}</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {option.highlights.map((h) => (
                <li key={h} className="flex gap-2">
                  <Check size={16} className="text-utp-mint mt-0.5 shrink-0" /> {h}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-2 text-center text-xs">
            <Metric value={`${option.credits}`} label="créditos" />
            <Metric value={`S/ ${Math.round(option.costPen)}`} label="costo" />
            <Metric value={`${Math.round(option.quality * 100)}%`} label="docentes" />
            <Metric value={`${Math.round(option.comfort * 100)}%`} label="comodidad" />
          </div>
        </div>

        <div className="mt-4">
          <WeekGrid chosen={chosen} busy={prefs.works ? prefs.busy : []} />
        </div>

        <ul className="divide-utp-line border-utp-line mt-5 divide-y overflow-hidden rounded-2xl border text-sm">
          {option.picks.map((p) => (
            <li key={p.course.code} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-5 py-3">
              <span className="w-full min-w-0 sm:w-auto sm:flex-1">
                <b>{p.course.name}</b>
                {p.course.repeated && <span className="bg-utp-red/10 text-utp-red ml-2 rounded-md px-1.5 py-0.5 text-[11px] font-bold">Repite</span>}
                <span className="block text-xs text-utp-muted">
                  Secc. {p.section.code} · {p.section.sessions.map((s) => `${DAY_SHORT[s.day]} ${s.start}–${s.end}`).join(", ")}
                </span>
              </span>
              <Link to={`/profesores/${p.section.professorId}`} className="text-utp-violet text-xs font-semibold hover:underline">
                {p.section.professorName ?? "Por asignar"}
              </Link>
              <span className="w-12 text-right text-xs font-bold tabular-nums">{p.professorScore ? `${p.professorScore.toFixed(1)}★` : "–"}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button onClick={onEdit} className="btn btn-outline text-utp-violet">
            Cambiar preferencias
          </button>
          <button onClick={() => use(option)} className="btn btn-accent px-6">
            Usar este horario
          </button>
        </div>
      </section>

      {result.left.length > 0 && (
        <section className="card p-6 text-sm">
          <h2 className="text-base font-bold">Cursos que no entraron en la opción A</h2>
          <ul className="mt-2 space-y-1">
            {result.left.map((l) => (
              <li key={l.course.code}>
                <b>{l.course.name}:</b> <span className="text-utp-muted">{l.reason}</span>
              </li>
            ))}
          </ul>
          {result.tips.length > 0 && (
            <p className="bg-utp-amber-soft mt-4 rounded-xl px-4 py-3 text-amber-900">{result.tips.join(" ")}</p>
          )}
        </section>
      )}
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-utp-bg min-w-[78px] rounded-xl px-3.5 py-2.5">
      <div className="font-display text-xl font-bold tabular-nums">{value}</div>
      <div className="text-utp-muted">{label}</div>
    </div>
  );
}
