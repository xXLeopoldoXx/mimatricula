import { Section, PROFESSORS, ALL_SECTIONS } from "../data";
import { T } from "../theme";

type Tab = "inicio" | "horario" | "profesores" | "optimizador" | "recomendaciones";
interface Props { studentName: string; enrolledSections: Section[]; onNavigate: (t: Tab) => void; }

const CALENDAR = [
  { date: "15 Ene 2025", label: "Apertura período de matrícula", active: true  },
  { date: "22 Ene 2025", label: "Cierre matrícula ordinaria",    active: false },
  { date: "29 Ene 2025", label: "Matrícula en ampliación",       active: false },
  { date: "03 Feb 2025", label: "Inicio de lecciones",           active: false },
];

const TOP3 = [...PROFESSORS].sort((a, b) => b.recommended - a.recommended).slice(0, 3);

export default function HomeView({ studentName, enrolledSections, onNavigate }: Props) {
  const credits = enrolledSections.reduce((a, s) => a + s.credits, 0);
  const courseCount = new Set(ALL_SECTIONS.map((s) => s.courseName)).size;
  const avgRec = Math.round(PROFESSORS.reduce((a, p) => a + p.recommended, 0) / PROFESSORS.length);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 60px", display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── Hero banner ── */}
      <div style={{
        background: T.red,
        borderRadius: T.rLg,
        padding: "32px 36px",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 32,
        alignItems: "center",
      }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: "rgba(255,255,255,0.6)", letterSpacing: "0.12em", marginBottom: 10 }}>
            PERÍODO DE MATRÍCULA · 2027-1
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 10 }}>
            Bienvenido, {studentName.split(" ")[0]}
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.65, maxWidth: 520 }}>
            La matrícula abre el <strong style={{ color: "#fff" }}>15 de enero</strong>.
            {enrolledSections.length > 0
              ? ` Tiene ${enrolledSections.length} cursos seleccionados (${credits} créditos).`
              : " Use el Generador para armar su horario óptimo."}
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            {([
              { label: "Generar horario",     tab: "optimizador"     },
              { label: "Ver profesores",      tab: "profesores"      },
              { label: "Recomendaciones",     tab: "recomendaciones" },
            ] as const).map((b) => (
              <button
                key={b.tab}
                onClick={() => onNavigate(b.tab)}
                style={{
                  fontFamily: T.sans, fontSize: 13, fontWeight: 500,
                  color: T.red, background: "#fff",
                  border: "none", borderRadius: T.rMd,
                  padding: "8px 16px", cursor: "pointer",
                  transition: "opacity 0.12s",
                }}
                onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
                onMouseOut={(e)  => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
        {/* Stat circle */}
        <div style={{
          width: 108, height: 108, borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
          border: "1.5px solid rgba(255,255,255,0.25)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 2, flexShrink: 0,
        }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{credits || "—"}</span>
          <span style={{ fontFamily: T.mono, fontSize: 9, color: "rgba(255,255,255,0.65)", letterSpacing: "0.1em" }}>CRÉDITOS</span>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { val: enrolledSections.length, label: "Cursos seleccionados",   sub: `de ${courseCount} disponibles`,    warn: false },
          { val: credits,                 label: "Créditos totales",        sub: credits > 18 ? "Sobrecarga" : "Dentro del límite", warn: credits > 18 },
          { val: new Set(enrolledSections.map(s => s.professorId)).size, label: "Docentes asignados", sub: "en selección actual", warn: false },
          { val: `${avgRec}%`,            label: "Satisfacción media",      sub: "comunidad estudiantil",            warn: false },
        ].map((s, i) => (
          <div key={i} style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderTop: `3px solid ${s.warn ? T.amber : T.red}`,
            borderRadius: T.rLg,
            padding: "18px 16px",
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.warn ? T.amber : T.text1, lineHeight: 1, marginBottom: 4 }}>{s.val}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text1, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: T.text3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Two-col lower ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>

        {/* Top professors */}
        <div>
          <SectionHead title="Docentes mejor evaluados" />
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rLg, overflow: "hidden" }}>
            {TOP3.map((p, i) => {
              const avg = Object.values(p.ratings).reduce((a, b) => a + b, 0) / 4;
              return (
                <div
                  key={p.id}
                  onClick={() => onNavigate("profesores")}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "16px 18px",
                    borderBottom: i < 2 ? `1px solid ${T.border}` : "none",
                    cursor: "pointer", transition: "background 0.1s",
                  }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLDivElement).style.background = T.surface2)}
                  onMouseOut={(e)  => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: i === 0 ? T.red : T.surface3,
                    border: `1px solid ${i === 0 ? T.red : T.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 12,
                    color: i === 0 ? "#fff" : T.text3, flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text1 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: T.text3, marginTop: 1 }}>{p.department}</div>
                    <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
                      {p.tags.slice(0, 2).map((t) => (
                        <span key={t} style={{ fontSize: 10, background: T.surface3, border: `1px solid ${T.border}`, borderRadius: 20, padding: "1px 8px", color: T.text2 }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: T.text1, lineHeight: 1 }}>{avg.toFixed(1)}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 9, color: T.text3, marginTop: 2 }}>/ 5.0</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.green, marginTop: 4 }}>{p.recommended}% rec.</div>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => onNavigate("recomendaciones")}
            style={{
              fontFamily: T.sans, fontSize: 13, color: T.red,
              background: "none", border: `1px solid ${T.border}`,
              borderRadius: T.rMd, padding: "9px 16px",
              cursor: "pointer", marginTop: 10, width: "100%",
              transition: "border-color 0.12s, background 0.12s",
            }}
            onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.red; (e.currentTarget as HTMLButtonElement).style.background = T.redBg; }}
            onMouseOut={(e)  => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.border; (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
          >
            Ver ranking completo →
          </button>
        </div>

        {/* Right: calendar + selection */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <SectionHead title="Calendario académico" />
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rLg, overflow: "hidden" }}>
              {CALENDAR.map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
                  background: item.active ? T.redBg : "transparent",
                  borderBottom: i < CALENDAR.length - 1 ? `1px solid ${T.border}` : "none",
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: item.active ? T.red : T.text3, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: T.mono, fontSize: 9, color: item.active ? T.red : T.text3, letterSpacing: "0.06em" }}>{item.date}</div>
                    <div style={{ fontSize: 12, color: item.active ? T.text1 : T.text2, fontWeight: item.active ? 500 : 400, marginTop: 1 }}>{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionHead title="Mi selección" />
            {enrolledSections.length === 0 ? (
              <div
                onClick={() => onNavigate("optimizador")}
                style={{
                  background: T.surface, border: `1px dashed ${T.border}`,
                  borderRadius: T.rLg, padding: "28px 16px", textAlign: "center",
                  cursor: "pointer", transition: "border-color 0.12s",
                }}
                onMouseOver={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = T.red)}
                onMouseOut={(e)  => ((e.currentTarget as HTMLDivElement).style.borderColor = T.border)}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: 13, color: T.text3 }}>Sin cursos seleccionados</div>
                <div style={{ fontSize: 12, color: T.red, marginTop: 6 }}>Usar el Generador →</div>
              </div>
            ) : (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rLg, overflow: "hidden" }}>
                {enrolledSections.map((s, i) => (
                  <div key={s.id} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                    borderBottom: i < enrolledSections.length - 1 ? `1px solid ${T.border}` : "none",
                  }}>
                    <div style={{ width: 3, height: 28, borderRadius: 2, background: T.red, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: T.text1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.courseName}</div>
                      <div style={{ fontFamily: T.mono, fontSize: 9, color: T.text3, marginTop: 1 }}>{s.day} {s.startHour}:00–{s.endHour}:00</div>
                    </div>
                    <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text3 }}>{s.credits}cr</div>
                  </div>
                ))}
                <div
                  onClick={() => onNavigate("horario")}
                  style={{
                    padding: "9px 12px", fontSize: 12, color: T.red, fontWeight: 500,
                    textAlign: "center", cursor: "pointer",
                    background: T.surface2, borderTop: `1px solid ${T.border}`,
                    transition: "background 0.1s",
                  }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLDivElement).style.background = T.redBg)}
                  onMouseOut={(e)  => ((e.currentTarget as HTMLDivElement).style.background = T.surface2)}
                >
                  Ver horario completo →
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: T.text1 }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  );
}
