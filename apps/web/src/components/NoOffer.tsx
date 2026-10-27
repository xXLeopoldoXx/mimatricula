import { Download, PlayCircle } from "lucide-react";
import { DEMO_OFFER } from "@mimatricula/demo-data";
import { useOfferStore } from "../store/offer";

/** Se muestra cuando todavía no hay oferta: importar con la extensión o usar la demo. */
export default function NoOffer() {
  const setImported = useOfferStore((s) => s.setImported);
  const useDemo = () =>
    setImported({ source: "utp-portal-mock", extractedAt: new Date().toISOString(), offer: DEMO_OFFER }, "demo");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="page-title">Empecemos por tu oferta de matrícula</h1>
      <p className="page-lead">Necesitamos los cursos, secciones y horarios que te ofrece la universidad para armar tu matrícula. Tienes dos caminos.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <section className="card flex flex-col p-6">
          <span className="bg-utp-violet-soft text-utp-violet flex h-11 w-11 items-center justify-center rounded-xl">
            <Download size={22} />
          </span>
          <h2 className="mt-4 text-lg font-bold">Importarla con la extensión</h2>
          <p className="text-utp-muted mt-1 text-sm">Lee tu portal sin tocar nada y trae tus cursos reales.</p>
          <ol className="text-utp-ink/80 mt-4 list-decimal space-y-1.5 pl-5 text-sm marker:font-semibold">
            <li>Abre el portal de matrícula.</li>
            <li>Haz clic en la extensión MiMatrícula.</li>
            <li>Pulsa “Extraer oferta” y luego “Enviar a MiMatrícula”.</li>
          </ol>
          <a href="http://localhost:5174/" target="_blank" rel="noreferrer" className="btn btn-primary mt-auto self-start">
            Abrir portal de matrícula
          </a>
        </section>

        <section className="card flex flex-col p-6">
          <span className="bg-utp-red/10 text-utp-red flex h-11 w-11 items-center justify-center rounded-xl">
            <PlayCircle size={22} />
          </span>
          <h2 className="mt-4 text-lg font-bold">Explorar con datos de demo</h2>
          <p className="text-utp-muted mt-1 mb-5 text-sm">Carga una oferta ficticia con 12 cursos y 102 secciones para probar todo el sistema ahora mismo.</p>
          <button onClick={useDemo} className="btn btn-outline mt-auto self-start">
            Usar datos de demo
          </button>
        </section>
      </div>
    </div>
  );
}
