import { useState } from "react";
import { BookOpen, CalendarDays, CreditCard, FilePlus2, Menu, X } from "lucide-react";
import { useOffer } from "./lib/useOffer";
import { useEnrollment } from "./lib/useEnrollment";
import { useHashRoute, type Route } from "./lib/useHashRoute";
import MatriculaPage from "./pages/MatriculaPage";
import HorarioPage from "./pages/HorarioPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import Logo from "./components/Logo";

const NAV: { id: Route; label: string; icon: typeof BookOpen }[] = [
  { id: "matricula", label: "Matrícula", icon: BookOpen },
  { id: "horario", label: "Horario", icon: CalendarDays },
  { id: "pensiones", label: "Pensiones", icon: CreditCard },
  { id: "secciones", label: "Solicitar secciones", icon: FilePlus2 },
];

export default function App() {
  const { offer, error } = useOffer();
  const enrollment = useEnrollment();
  const { route, go } = useHashRoute();
  const [drawer, setDrawer] = useState(false);

  const navigate = (r: Route) => {
    go(r);
    setDrawer(false);
  };

  return (
    <div className="flex min-h-full flex-col">
      <div className="bg-utp-navy px-4 py-1 text-center text-[11px] font-bold tracking-wide text-white">
        PORTAL DE SIMULACIÓN ACADÉMICA · No es el sitio oficial de la universidad
      </div>

      <header className="sticky top-0 z-30 flex h-16 items-center border-b border-utp-line bg-white">
        <button
          onClick={() => setDrawer((v) => !v)}
          className="flex h-16 w-16 shrink-0 items-center justify-center bg-utp-red text-white hover:bg-utp-red-dark md:w-20"
          aria-label={drawer ? "Cerrar menú" : "Abrir menú"}
        >
          {drawer ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="flex flex-1 items-center justify-between gap-3 px-4 md:px-8">
          <Logo />
          <div className="text-right leading-tight" data-mm="student">
            <div className="text-[13px] font-black uppercase" data-mm-field="name">
              {offer?.student.name ?? "…"}
            </div>
            <div className="text-[11px] text-utp-muted" data-mm-field="code">
              {offer?.student.code}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar de escritorio */}
        <nav className="sticky top-16 hidden h-[calc(100vh-4rem)] w-20 shrink-0 flex-col border-r border-utp-line bg-white md:flex">
          {NAV.map((n) => (
            <SideItem key={n.id} item={n} active={route === n.id} onClick={() => navigate(n.id)} />
          ))}
        </nav>

        {/* Menú móvil */}
        {drawer && (
          <div className="fixed inset-0 top-16 z-20 bg-black/30 md:hidden" onClick={() => setDrawer(false)}>
            <nav className="w-64 bg-white py-2 shadow-xl" onClick={(e) => e.stopPropagation()}>
              {NAV.map((n) => (
                <button
                  key={n.id}
                  onClick={() => navigate(n.id)}
                  className={`flex w-full items-center gap-3 px-5 py-3 text-left text-sm ${
                    route === n.id ? "border-l-4 border-utp-red bg-utp-bg font-bold" : "border-l-4 border-transparent"
                  }`}
                >
                  <n.icon size={20} />
                  {n.label}
                </button>
              ))}
            </nav>
          </div>
        )}

        <main className="min-w-0 flex-1 px-3 py-5 md:px-8 md:py-8">
          {error && (
            <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 text-center text-red-700 shadow-sm">
              No se pudo cargar la oferta de matrícula ({error}). Ejecuta <code>pnpm gen:data</code>.
            </div>
          )}
          {!offer && !error && <div className="py-20 text-center text-utp-muted">Cargando oferta académica…</div>}
          {offer && route === "matricula" && <MatriculaPage offer={offer} enrollment={enrollment} />}
          {offer && route === "horario" && <HorarioPage offer={offer} enrollment={enrollment} />}
          {offer && route === "pensiones" && <PlaceholderPage title="Pensiones" />}
          {offer && route === "secciones" && <PlaceholderPage title="Solicitar secciones" />}
        </main>
      </div>
    </div>
  );
}

function SideItem({ item, active, onClick }: { item: (typeof NAV)[number]; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 border-l-4 px-1 py-4 text-center text-[11px] leading-tight transition-colors ${
        active ? "border-utp-red bg-utp-bg font-bold" : "border-transparent hover:bg-utp-bg"
      }`}
    >
      <Icon size={20} strokeWidth={1.8} />
      {item.label}
    </button>
  );
}
