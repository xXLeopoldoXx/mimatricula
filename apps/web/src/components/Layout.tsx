import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { BookOpen, CalendarDays, Home, LogOut, Sparkles, Users, Wand2 } from "lucide-react";
import type { Student } from "@mimatricula/shared";
import { useOfferStore } from "../store/offer";
import { initials } from "../auth/useStudent";

export const NAV = [
  { to: "/", label: "Inicio", icon: Home, end: true },
  { to: "/cursos", label: "Cursos", icon: BookOpen },
  { to: "/horario", label: "Mi Horario", icon: CalendarDays },
  { to: "/profesores", label: "Profesores", icon: Users },
  { to: "/recomendaciones", label: "Recomendar", icon: Sparkles },
  { to: "/generador", label: "Generador", icon: Wand2 },
] as const;

export default function Layout({ student, onLogout }: { student: Student; onLogout: () => void }) {
  const [menu, setMenu] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center border-b border-utp-line bg-white">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-utp-red text-lg font-black text-white md:w-20">
          M+
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 md:px-8">
          <div className="min-w-0 leading-tight">
            <div className="truncate text-lg font-black">MiMatrícula</div>
            <div className="hidden text-[11px] text-utp-muted sm:block">Matrícula inteligente con reseñas estudiantiles</div>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenu((v) => !v)}
              className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-utp-bg"
              aria-haspopup="menu"
              aria-expanded={menu}
            >
              <span className="hidden text-right leading-tight sm:block">
                <span className="block text-[13px]">
                  Hola, <b>{student.name.split(" ")[0]}</b>
                </span>
                <span className="block text-[11px] text-utp-muted">{student.code ?? student.email}</span>
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-utp-violet text-sm font-bold text-white">
                {initials(student.name)}
              </span>
            </button>
            {menu && (
              <div role="menu" className="absolute right-0 mt-2 w-56 rounded-lg border border-utp-line bg-white py-1 shadow-lg">
                <div className="border-b border-utp-line px-4 py-2 text-xs text-utp-muted">{student.email}</div>
                <button
                  role="menuitem"
                  onClick={onLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-utp-bg"
                >
                  <LogOut size={16} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="sticky top-16 hidden h-[calc(100vh-4rem)] w-20 shrink-0 flex-col border-r border-utp-line bg-white md:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={"end" in n}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 border-l-4 px-1 py-4 text-center text-[11px] leading-tight transition-colors ${
                  isActive ? "border-utp-red bg-utp-bg font-bold" : "border-transparent hover:bg-utp-bg"
                }`
              }
            >
              <n.icon size={20} strokeWidth={1.8} />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <main className="min-w-0 flex-1 pb-20 md:pb-0">
          <ImportedBanner />
          <div className="px-3 py-5 md:px-8 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Navegación inferior en el celular */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-utp-line bg-white md:hidden">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={"end" in n}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-[10px] ${isActive ? "font-bold text-utp-violet" : "text-utp-muted"}`
            }
          >
            <n.icon size={20} strokeWidth={1.8} />
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function ImportedBanner() {
  const { imported, justImported, dismiss } = useOfferStore();
  const navigate = useNavigate();
  if (!imported || !justImported) return null;
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
        <button
          onClick={() => {
            dismiss();
            navigate("/cursos");
          }}
          className="rounded-md bg-emerald-700 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-800"
        >
          Ver cursos
        </button>
        <button onClick={dismiss} className="rounded-md px-2 py-1 text-xs underline">
          Cerrar
        </button>
      </span>
    </div>
  );
}
