import { Download, PlayCircle } from "lucide-react";
import { DEMO_OFFER } from "@mimatricula/demo-data";
import { useOfferStore } from "../store/offer";

/** Se muestra cuando todavía no hay oferta: importar con la extensión o usar la demo. */
export default function NoOffer() {
  const setImported = useOfferStore((s) => s.setImported);
  const useDemo = () =>
    setImported({ source: "utp-portal-mock", extractedAt: new Date().toISOString(), offer: DEMO_OFFER }, "demo");

  return (
    <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-sm md:p-8">
      <h1 className="text-xl font-bold">Primero importa tu oferta de matrícula</h1>
      <p className="mt-1 text-sm text-utp-muted">
        Necesitamos los cursos, secciones y horarios que te ofrece la universidad para armar tu matrícula.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-utp-line p-4">
          <Download className="text-utp-violet" size={22} />
          <h2 className="mt-2 font-bold">Con la extensión</h2>
          <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-sm text-utp-muted">
            <li>Abre el portal de matrícula.</li>
            <li>Haz clic en la extensión MiMatrícula.</li>
            <li>"Extraer oferta" → "Enviar a MiMatrícula".</li>
          </ol>
          <a
            href="http://localhost:5174/"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block rounded-md bg-utp-violet px-3 py-2 text-sm font-bold text-white hover:bg-utp-violet-dark"
          >
            Abrir portal de matrícula
          </a>
        </div>
        <div className="rounded-lg border border-utp-line p-4">
          <PlayCircle className="text-utp-red" size={22} />
          <h2 className="mt-2 font-bold">Probar con datos de demo</h2>
          <p className="mt-1 text-sm text-utp-muted">Carga una oferta ficticia (12 cursos, 102 secciones) para explorar el sistema.</p>
          <button
            onClick={useDemo}
            className="mt-3 rounded-md border border-utp-violet px-3 py-2 text-sm font-bold text-utp-violet hover:bg-utp-violet-soft"
          >
            Usar datos de demo
          </button>
        </div>
      </div>
    </div>
  );
}
