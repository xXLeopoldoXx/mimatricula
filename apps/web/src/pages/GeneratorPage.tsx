import { Wand2 } from "lucide-react";
import { Link } from "react-router";

/** Fase 5: asistente de preferencias (turno, trabajo, límites, presupuesto) + generador. */
export default function GeneratorPage() {
  const steps = [
    ["Turno", "Mañana, tarde o noche"],
    ["Trabajo", "Pinta en una grilla tus horas ocupadas"],
    ["Límites", "Máximo de cursos y presupuesto en soles"],
    ["Resumen", "Revisa y genera tus 3 mejores horarios"],
  ];
  return (
    <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-sm md:p-8">
      <Wand2 className="text-utp-violet" size={28} />
      <h1 className="mt-2 text-xl font-bold">Generador inteligente</h1>
      <p className="mt-1 text-sm text-utp-muted">
        Llega en la siguiente fase. Te hará 4 preguntas con botones y armará las mejores combinaciones sin cruces, priorizando a los
        docentes mejor evaluados.
      </p>
      <ol className="mt-5 grid gap-2 sm:grid-cols-2">
        {steps.map(([t, d], i) => (
          <li key={t} className="flex gap-3 rounded-lg border border-utp-line p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-utp-violet-soft text-sm font-bold text-utp-violet">
              {i + 1}
            </span>
            <span>
              <b className="block text-sm">{t}</b>
              <span className="text-xs text-utp-muted">{d}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-5 text-sm">
        Mientras tanto, usa{" "}
        <Link to="/recomendaciones" className="font-bold text-utp-violet underline">
          Recomendaciones
        </Link>{" "}
        para elegir la mejor sección de cada curso.
      </p>
    </div>
  );
}
