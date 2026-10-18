import { useMemo, useState } from "react";
import { DAYS, formatSession, type CatalogImport } from "@mimatricula/shared";

interface Props {
  imported: CatalogImport | null;
  onClear: () => void;
}

/** Muestra lo que trajo la extensión. Sirve para verificar la importación antes de la fase 3. */
export default function OfferView({ imported, onClear }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [shift, setShift] = useState<"TODOS" | "MANANA" | "NOCHE">("TODOS");

  const byCourse = useMemo(() => {
    const m = new Map<string, CatalogImport["offer"]["sections"]>();
    for (const s of imported?.offer.sections ?? []) {
      if (shift !== "TODOS" && s.shift !== shift) continue;
      m.set(s.courseCode, [...(m.get(s.courseCode) ?? []), s]);
    }
    // Mañana primero, luego por día y hora de la primera sesión
    const key = (s: CatalogImport["offer"]["sections"][number]) =>
      `${s.shift === "NOCHE" ? 1 : 0}${DAYS.indexOf(s.sessions[0]!.day)}${s.sessions[0]!.start}`;
    for (const list of m.values()) list.sort((a, b) => key(a).localeCompare(key(b)));
    return m;
  }, [imported, shift]);

  if (!imported) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-[#111827]">Todavía no hay oferta importada</h1>
        <ol className="mx-auto mt-4 max-w-md list-decimal space-y-1 pl-5 text-left text-sm text-[#4b5563]">
          <li>Abre el portal de matrícula (http://localhost:5174).</li>
          <li>Haz clic en el ícono de la extensión MiMatrícula.</li>
          <li>Presiona "Extraer oferta" y luego "Enviar a MiMatrícula".</li>
        </ol>
      </div>
    );
  }

  const o = imported.offer;
  const extracted = new Date(imported.extractedAt).toLocaleString("es-PE");

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-8 pb-16 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-[#111827]">Oferta importada · {o.term}</h1>
          <p className="mt-1 text-[13px] text-[#9ca3af]">
            {o.university} · extraída el {extracted} · {o.courses.length} cursos, {o.sections.length} secciones
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={shift}
            onChange={(e) => setShift(e.target.value as typeof shift)}
            className="rounded-md border border-[#d1d5db] bg-white px-2 py-1.5 text-sm"
            aria-label="Filtrar por turno"
          >
            <option value="TODOS">Todos los turnos</option>
            <option value="MANANA">Mañana</option>
            <option value="NOCHE">Noche</option>
          </select>
          <button onClick={onClear} className="rounded-md border border-[#d1d5db] bg-white px-3 py-1.5 text-sm hover:bg-[#f8f9fb]">
            Borrar importación
          </button>
        </div>
      </div>

      <ul className="mt-6 flex flex-col gap-2">
        {o.courses.map((c) => {
          const secs = byCourse.get(c.code) ?? [];
          const expanded = open === c.code;
          return (
            <li key={c.code} className="overflow-hidden rounded-lg border border-[#e2e6ea] bg-white">
              <button
                onClick={() => setOpen(expanded ? null : c.code)}
                className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left hover:bg-[#f8f9fb]"
                aria-expanded={expanded}
              >
                <span className="text-sm font-semibold text-[#111827]">
                  {c.code} · {c.name}
                  {c.repeated && <span className="ml-2 rounded bg-[#c8293a] px-1.5 py-0.5 text-[10px] text-white">REPETIDO</span>}
                </span>
                <span className="text-xs text-[#4b5563]">
                  {c.credits} cr · ciclo {c.cycle} · {secs.length} secciones {expanded ? "▲" : "▼"}
                </span>
              </button>
              {expanded && (
                <div className="overflow-x-auto border-t border-[#e2e6ea]">
                  <table className="w-full min-w-[560px] text-[13px]">
                    <thead className="bg-[#f8f9fb] text-left text-[#4b5563]">
                      <tr>
                        <th className="px-4 py-2 font-medium">Sección</th>
                        <th className="px-2 py-2 font-medium">Horario</th>
                        <th className="px-2 py-2 font-medium">Docente</th>
                        <th className="px-2 py-2 font-medium">Turno</th>
                        <th className="px-2 py-2 font-medium">Vacantes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {secs.map((s) => (
                        <tr key={s.code} className="border-t border-[#e2e6ea] align-top">
                          <td className="px-4 py-2 font-semibold">{s.code}</td>
                          <td className="px-2 py-2">
                            {s.sessions.map((ss, i) => (
                              <div key={i}>{formatSession(ss)}</div>
                            ))}
                          </td>
                          <td className="px-2 py-2">{s.professorName ?? "Por asignar"}</td>
                          <td className="px-2 py-2">{s.shift === "NOCHE" ? "Noche" : "Mañana"}</td>
                          <td className="px-2 py-2">
                            {Math.max(0, s.capacity - s.enrolled)} / {s.capacity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
