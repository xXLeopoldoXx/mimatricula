import type { CatalogImport } from "@mimatricula/shared";

interface Props {
  imported: CatalogImport | null;
  justImported: boolean;
  onView: () => void;
  onDismiss: () => void;
}

/** Aviso bajo el header: invita a importar o confirma la importación. */
export default function ImportBanner({ imported, justImported, onView, onDismiss }: Props) {
  if (imported && !justImported) return null;

  if (!imported) {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-[13px] text-amber-900">
        Aún no importas tu oferta de matrícula. Abre el portal de matrícula y usa la extensión <b>MiMatrícula</b> →
        "Extraer oferta" → "Enviar a MiMatrícula".
      </div>
    );
  }

  const o = imported.offer;
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-b border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-900"
    >
      <span>
        ✓ Oferta {o.term} importada: <b>{o.courses.length}</b> cursos, <b>{o.sections.length}</b> secciones y{" "}
        <b>{o.professors.length}</b> docentes.
      </span>
      <span className="flex gap-2">
        <button onClick={onView} className="rounded-md bg-emerald-700 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-800">
          Ver oferta
        </button>
        <button onClick={onDismiss} className="rounded-md px-2 py-1 text-xs underline">
          Cerrar
        </button>
      </span>
    </div>
  );
}
