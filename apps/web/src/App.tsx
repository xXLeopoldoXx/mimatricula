import { useState } from "react";
import HomeView from "./views/HomeView";
import ScheduleView from "./views/ScheduleView";
import ProfessorsView from "./views/ProfessorsView";
import OptimizerView from "./views/OptimizerView";
import RecommendationsView from "./views/RecommendationsView";
import { Section } from "./data";
import { T } from "./theme";
import LoginView from "./views/LoginView";
import { initials, useStudent } from "./auth/useStudent";
import { useImportedOffer } from "./import/useImportedOffer";
import ImportBanner from "./import/ImportBanner";
import OfferView from "./views/OfferView";

type Tab = "inicio" | "oferta" | "horario" | "profesores" | "optimizador" | "recomendaciones";

const NAV: { id: Tab; label: string }[] = [
  { id: "inicio",          label: "Inicio"          },
  { id: "oferta",          label: "Mi Oferta"       },
  { id: "horario",         label: "Mi Horario"      },
  { id: "profesores",      label: "Profesores"       },
  { id: "optimizador",     label: "Generador"        },
  { id: "recomendaciones", label: "Recomendaciones"  },
];

export default function App() {
  const { student, login, logout } = useStudent();
  // Escucha a la extensión siempre, incluso en la pantalla de login
  const offer = useImportedOffer();
  if (!student) return <LoginView onLogin={login} />;
  return <Shell name={student.name} onLogout={logout} offer={offer} />;
}

function Shell({ name, onLogout, offer }: { name: string; onLogout: () => void; offer: ReturnType<typeof useImportedOffer> }) {
  const [tab, setTab]         = useState<Tab>("inicio");
  const [sections, setSections] = useState<Section[]>([]);
  const [visible, setVisible]   = useState(true);

  const go = (next: Tab) => {
    if (next === tab) return;
    setVisible(false);
    setTimeout(() => { setTab(next); setVisible(true); }, 110);
  };

  const add    = (s: Section) => setSections((p) => p.find((x) => x.id === s.id) ? p : [...p, s]);
  const remove = (id: string)  => setSections((p) => p.filter((s) => s.id !== id));
  const apply  = (ss: Section[]) => { setSections(ss); go("horario"); };

  const credits = sections.reduce((a, s) => a + s.credits, 0);

  return (
    <div style={{ fontFamily: T.sans, minHeight: "100%", display: "flex", flexDirection: "column", background: T.bg }}>

      {/* ── Top institutional bar ── */}
      <div style={{
        background: T.red,
        padding: "0 24px",
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: "rgba(255,255,255,0.8)", letterSpacing: "0.1em" }}>
          UNIVERSIDAD TECNOLÓGICA DEL PERÚ · SIMULACIÓN
        </span>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em" }}>
          PERIODO 2027-1
        </span>
      </div>

      {/* ── Main header ── */}
      <header style={{
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          padding: "0 24px",
          height: 56,
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 16,
        }}>
          {/* Logo */}
          <button
            onClick={() => go("inicio")}
            style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: T.rMd,
              background: T.red,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 16, color: "#fff", letterSpacing: "-0.02em" }}>M+</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.text1, letterSpacing: "-0.01em", lineHeight: 1.2 }}>Matrícula+</div>
              <div style={{ fontFamily: T.mono, fontSize: 9, color: T.text3, letterSpacing: "0.08em", lineHeight: 1 }}>GESTIÓN ACADÉMICA</div>
            </div>
          </button>

          {/* Nav */}
          <nav style={{ display: "flex", alignItems: "stretch", height: 56, gap: 0 }}>
            {NAV.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => go(item.id)}
                  style={{
                    fontFamily: T.sans,
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? T.red : T.text2,
                    background: "none",
                    border: "none",
                    borderBottom: `2px solid ${active ? T.red : "transparent"}`,
                    padding: "0 14px",
                    cursor: "pointer",
                    transition: "color 0.12s, border-color 0.12s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseOver={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = T.text1; }}
                  onMouseOut={(e)  => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = T.text2; }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {sections.length > 0 && (
              <button
                onClick={() => go("horario")}
                style={{
                  fontFamily: T.mono, fontSize: 10, letterSpacing: "0.05em",
                  color: T.red,
                  background: T.redBg,
                  border: `1px solid rgba(200,41,58,0.2)`,
                  borderRadius: 20, padding: "4px 12px",
                  cursor: "pointer", transition: "background 0.12s",
                }}
                onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.background = T.redBg2; }}
                onMouseOut={(e)  => { (e.currentTarget as HTMLButtonElement).style.background = T.redBg; }}
              >
                {sections.length} cursos · {credits} cr
              </button>
            )}
            <button
              onClick={onLogout}
              title={`${name} · Cerrar sesión`}
              aria-label="Cerrar sesión"
              style={{
                width: 34, height: 34,
                borderRadius: "50%",
                background: T.red, border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 600, fontSize: 12, color: "#fff", cursor: "pointer",
              }}
            >
              {initials(name)}
            </button>
          </div>
        </div>
      </header>

      <ImportBanner
        imported={offer.imported}
        justImported={offer.justImported}
        onView={() => { offer.dismiss(); go("oferta"); }}
        onDismiss={offer.dismiss}
      />

      {/* ── Content ── */}
      <main style={{
        flex: 1,
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(4px)",
        transition: "opacity 0.13s, transform 0.13s",
      }}>
        {tab === "inicio"          && <HomeView studentName={name} enrolledSections={sections} onNavigate={go} />}
        {tab === "oferta"          && <OfferView imported={offer.imported} onClear={offer.clear} />}
        {tab === "horario"         && <ScheduleView enrolledSections={sections} onRemove={remove} onAdd={add} />}
        {tab === "profesores"      && <ProfessorsView onNavigateToSchedule={() => go("horario")} />}
        {tab === "optimizador"     && <OptimizerView enrolledSections={sections} onApply={apply} />}
        {tab === "recomendaciones" && <RecommendationsView onAddSection={add} />}
      </main>

      {/* ── Footer ── */}
      <footer style={{
        background: T.surface,
        borderTop: `1px solid ${T.border}`,
        padding: "10px 24px",
        textAlign: "center",
      }}>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.text3, letterSpacing: "0.06em" }}>
          MATRÍCULA+ · SISTEMA DE GESTIÓN ACADÉMICA · PROYECTO ACADÉMICO
        </span>
      </footer>
    </div>
  );
}
