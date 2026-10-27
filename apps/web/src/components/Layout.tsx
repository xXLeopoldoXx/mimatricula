import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { BookOpen, CalendarDays, Home, LogOut, Sparkles, Users, Wand2 } from "lucide-react";
import type { Student } from "@mimatricula/shared";
import { useOfferStore } from "../store/offer";
import { initials } from "../auth/useStudent";
import { MAX_CREDITS, round2, useCatalog, useChosen } from "../lib/catalog";
import { LogoMark, Wordmark } from "./Logo";

export const NAV = [
  { to: "/", label: "Inicio", short: "Inicio", icon: Home, end: true },
  { to: "/cursos", label: "Cursos", short: "Cursos", icon: BookOpen },
  { to: "/horario", label: "Mi horario", short: "Horario", icon: CalendarDays },
  { to: "/profesores", label: "Profesores", short: "Docentes", icon: Users },
  { to: "/recomendaciones", label: "Recomendaciones", short: "Mejores", icon: Sparkles },
  { to: "/generador", label: "Generador de horarios", short: "Generador", icon: Wand2 },
] as const;

export default function Layout({ student, onLogout }: { student: Student; onLogout: () => void }) {
  return (
    <div className="min-h-screen">
      <TopBar student={student} onLogout={onLogout} />
      <main className="min-w-0 pb-28 lg:pb-0">
        <ImportedBanner />
        <div className="wrap py-6 md:py-10">
          <Outlet />
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}

function TopBar({ student, onLogout }: { student: Student; onLogout: () => void }) {
  const [menu, setMenu] = useState(false);
  return (
    <header className="sticky top-0 z-30">
      <div className="bg-utp-orange hidden text-center text-xs font-bold text-white md:block">
        <div className="wrap flex items-center justify-center gap-2 py-2">
          <Sparkles size={14} /> Matrícula 2027: compara docentes con reseñas reales antes de elegir.
        </div>
      </div>
      <div className="border-utp-line border-b bg-white/90 backdrop-blur">
        <div className="wrap flex h-16 items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2.5" aria-label="Inicio">
            <LogoMark size={36} />
            <Wordmark />
          </NavLink>
          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="Principal">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={"end" in n}
                className={({ isActive }) =>
                  `rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${isActive ? "bg-utp-violet-soft text-utp-violet" : "text-utp-muted hover:text-utp-ink"}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 lg:ml-0">
            <CreditMeter />
            <div className="relative">
              <button
                onClick={() => setMenu((v) => !v)}
                className="bg-utp-navy flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                aria-haspopup="menu"
                aria-expanded={menu}
                aria-label="Menú de tu cuenta"
              >
                {initials(student.name)}
              </button>
              {menu && (
                <div role="menu" className="border-utp-line shadow-lift absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border bg-white py-1">
                  <div className="border-utp-line border-b px-4 py-3">
                    <div className="truncate text-sm font-semibold">{student.name}</div>
                    <div className="text-utp-muted truncate text-xs">{student.code ?? student.email}</div>
                  </div>
                  <button role="menuitem" onClick={onLogout} className="hover:bg-utp-bg flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium">
                    <LogOut size={16} /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-utp-night mt-12 hidden text-white md:block">
      <div className="wrap grid gap-8 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark size={36} />
            <Wordmark dark />
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">Proyecto académico UTP. Matrícula inteligente con recomendación de docentes basada en reseñas estudiantiles.</p>
        </div>
        <div className="text-sm">
          <div className="font-bold">Explora</div>
          <ul className="mt-3 space-y-2 text-white/65">
            {NAV.slice(1, 4).map((n) => (
              <li key={n.to}>
                <NavLink to={n.to} className="hover:text-white">{n.label}</NavLink>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-sm">
          <div className="font-bold">Herramientas</div>
          <ul className="mt-3 space-y-2 text-white/65">
            <li><NavLink to="/recomendaciones" className="hover:text-white">Recomendaciones</NavLink></li>
            <li><NavLink to="/generador" className="hover:text-white">Generador de horarios</NavLink></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">© 2026 MiMatrícula · Versión de demostración</div>
    </footer>
  );
}

/** Créditos elegidos frente al máximo: siempre visible mientras se arma la matrícula. */
function CreditMeter() {
  const catalog = useCatalog();
  const chosen = useChosen(catalog);
  if (!catalog) return null;
  const credits = round2(chosen.reduce((a, c) => a + c.course.credits, 0));
  const pct = Math.min(100, (credits / MAX_CREDITS) * 100);
  const over = credits > MAX_CREDITS;
  return (
    <div className="bg-utp-bg hidden items-center gap-3 rounded-full py-1.5 pr-4 pl-3 sm:flex" title="Créditos elegidos">
      <span className={`font-display text-lg font-extrabold tabular-nums ${over ? "text-utp-red" : "text-utp-navy"}`}>{credits}</span>
      <span className="text-utp-muted text-xs leading-tight font-semibold">de {MAX_CREDITS}<br />créditos</span>
      <div className="bg-utp-line h-1.5 w-14 overflow-hidden rounded-full" role="progressbar" aria-valuenow={credits} aria-valuemin={0} aria-valuemax={MAX_CREDITS} aria-label="Créditos elegidos">
        <div className={`h-full rounded-full transition-all duration-500 ${over ? "bg-utp-red" : "bg-utp-violet"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MobileNav() {
  return (
    <nav
      aria-label="Principal"
      className="bg-utp-night/95 shadow-lift fixed inset-x-3 bottom-3 z-30 grid grid-cols-6 rounded-2xl border border-white/10 p-1 backdrop-blur lg:hidden"
    >
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={"end" in n}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-medium outline-white transition-colors ${
              isActive ? "bg-white/14 text-white" : "text-white/60"
            }`
          }
        >
          <n.icon size={20} strokeWidth={1.8} />
          {n.short}
        </NavLink>
      ))}
    </nav>
  );
}

function ImportedBanner() {
  const { imported, justImported, dismiss } = useOfferStore();
  const navigate = useNavigate();
  if (!imported || !justImported) return null;
  const o = imported.offer;
  return (
    <div role="status" className="border-utp-mint/15 bg-utp-mint-soft text-utp-mint flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-b px-4 py-3 text-sm">
      <span>
        Oferta {o.term} importada: <b>{o.courses.length}</b> cursos, <b>{o.sections.length}</b> secciones y <b>{o.professors.length}</b> docentes.
      </span>
      <span className="flex gap-2">
        <button
          onClick={() => {
            dismiss();
            navigate("/cursos");
          }}
          className="bg-utp-mint rounded-lg px-3 py-1.5 text-xs font-bold text-white hover:brightness-110"
        >
          Ver cursos
        </button>
        <button onClick={dismiss} className="rounded-lg px-2 py-1.5 text-xs font-semibold underline">
          Cerrar
        </button>
      </span>
    </div>
  );
}
