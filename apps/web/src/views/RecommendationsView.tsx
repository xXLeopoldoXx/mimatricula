import { useState } from "react";
import { PROFESSORS, ALL_SECTIONS, Section, Professor } from "../data";
import { T } from "../theme";
import StarRating from "../components/StarRating";

interface Props { onAddSection: (s: Section) => void; }

const METRICS: { key: keyof Professor["ratings"]; label: string }[] = [
  { key: "clarity",     label: "Claridad"    },
  { key: "rigor",       label: "Exigencia"   },
  { key: "punctuality", label: "Puntualidad" },
  { key: "treatment",   label: "Trato"       },
];

const PRIORITY_OPTS = [
  { id: "balanced",  label: "Equilibrado"    },
  { id: "clarity",   label: "Claridad"       },
  { id: "treatment", label: "Buen trato"     },
  { id: "rigor",     label: "Menos exigente" },
] as const;
type Priority = typeof PRIORITY_OPTS[number]["id"];

function calcScore(p: Professor, priority: Priority) {
  if (priority === "balanced")
    return p.ratings.clarity * 0.35 + p.ratings.treatment * 0.3 + p.ratings.punctuality * 0.2 + (p.recommended / 100) * 5 * 0.15;
  if (priority === "rigor")
    return (5 - p.ratings.rigor) * 0.5 + p.ratings.treatment * 0.3 + (p.recommended / 100) * 5 * 0.2;
  return p.ratings[priority] * 0.65 + (p.recommended / 100) * 5 * 0.35;
}

export default function RecommendationsView({ onAddSection }: Props) {
  const [priority, setPriority] = useState<Priority>("balanced");
  const [added, setAdded]       = useState<Set<string>>(new Set());

  const handleAdd = (s: Section) => { onAddSection(s); setAdded((p) => new Set([...p, s.id])); };

  const ranked = [...PROFESSORS]
    .map((p) => ({ p, score: calcScore(p, priority) }))
    .sort((a, b) => b.score - a.score);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 60px", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text1, letterSpacing: "-0.01em" }}>Ranking de Docentes</h1>
          <p style={{ fontSize: 13, color: T.text3, marginTop: 4 }}>Clasificación basada en reseñas de la comunidad estudiantil.</p>
        </div>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rLg, padding: "12px 16px" }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text3, letterSpacing: "0.08em", marginBottom: 8 }}>SU PRIORIDAD</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PRIORITY_OPTS.map((opt) => {
              const active = priority === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setPriority(opt.id)}
                  style={{
                    fontFamily: T.sans, fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    color: active ? "#fff" : T.text2,
                    background: active ? T.red : T.surface2,
                    border: `1px solid ${active ? T.red : T.border}`,
                    borderRadius: T.rMd, padding: "5px 14px",
                    cursor: "pointer", transition: "all 0.11s",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.red}`, borderRadius: T.rMd, padding: "11px 16px", fontSize: 12, color: T.text2, lineHeight: 1.65 }}>
        <strong style={{ color: T.text1 }}>Algoritmo de ponderación:</strong>{" "}
        claridad (35%) · trato (30%) · puntualidad (20%) · % recomendación (15%). Los coeficientes se ajustan según su prioridad.
      </div>

      {/* Table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rLg, overflow: "hidden" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 200px 160px 72px", padding: "8px 18px", background: T.surface2, borderBottom: `1px solid ${T.border}` }}>
          {["#", "DOCENTE", "MÉTRICAS", "RECOMENDACIÓN", "SCORE"].map((h) => (
            <div key={h} style={{ fontFamily: T.mono, fontSize: 9, color: T.text3, letterSpacing: "0.08em" }}>{h}</div>
          ))}
        </div>

        {ranked.map(({ p, score }, idx) => (
          <ProfRow key={p.id} professor={p} score={score} rank={idx + 1} sections={ALL_SECTIONS.filter((s) => s.professorId === p.id)} onAdd={handleAdd} added={added} />
        ))}
      </div>
    </div>
  );
}

function ProfRow({ professor: p, score, rank, sections, onAdd, added }: {
  professor: Professor; score: number; rank: number;
  sections: Section[]; onAdd: (s: Section) => void; added: Set<string>;
}) {
  const [open, setOpen] = useState(false);
  const avg = Object.values(p.ratings).reduce((a, b) => a + b, 0) / 4;
  const top = rank <= 3;

  return (
    <>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "grid", gridTemplateColumns: "48px 1fr 200px 160px 72px",
          padding: "13px 18px", borderBottom: `1px solid ${T.border}`,
          background: open ? T.surface2 : T.surface,
          alignItems: "center", cursor: "pointer", transition: "background 0.1s",
        }}
        onMouseOver={(e) => { if (!open) (e.currentTarget as HTMLDivElement).style.background = T.surface2; }}
        onMouseOut={(e)  => { if (!open) (e.currentTarget as HTMLDivElement).style.background = T.surface; }}
      >
        {/* Rank */}
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: rank === 1 ? T.red : rank <= 3 ? T.surface3 : "transparent",
          border: `1px solid ${rank <= 3 ? (rank === 1 ? T.red : T.border) : "transparent"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 12,
          color: rank === 1 ? "#fff" : top ? T.text2 : T.text3,
        }}>
          {rank}
        </div>

        {/* Name */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text1 }}>{p.name}</div>
          <div style={{ fontSize: 11, color: T.text3, marginTop: 1 }}>{p.department}</div>
          <div style={{ display: "flex", gap: 4, marginTop: 5 }}>
            {p.tags.slice(0,2).map((t) => (
              <span key={t} style={{ fontSize: 10, background: T.surface3, border: `1px solid ${T.border}`, borderRadius: 20, padding: "1px 7px", color: T.text2 }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Metrics mini bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {METRICS.map((m) => {
            const v = p.ratings[m.key];
            const c = v >= 4.5 ? T.green : v >= 3.5 ? T.amber : T.red;
            return (
              <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: T.mono, fontSize: 8, color: T.text3, width: 50, flexShrink: 0, letterSpacing: "0.04em" }}>{m.label.slice(0,5).toUpperCase()}</span>
                <div style={{ flex: 1, height: 3, background: T.surface3, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${(v/5)*100}%`, height: "100%", background: c }} />
                </div>
                <span style={{ fontFamily: T.mono, fontSize: 8, color: T.text2, width: 18 }}>{v.toFixed(1)}</span>
              </div>
            );
          })}
        </div>

        {/* Rec */}
        <div style={{ textAlign: "center" }}>
          <StarRating value={avg} size={11} />
          <div style={{ fontWeight: 600, fontSize: 13, color: p.recommended >= 85 ? T.green : T.amber, marginTop: 3 }}>{p.recommended}%</div>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: T.text3 }}>{p.reviewCount} reseñas</div>
        </div>

        {/* Score */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: score >= 4.2 ? T.red : T.text1, lineHeight: 1 }}>{score.toFixed(2)}</div>
          <div style={{ fontFamily: T.mono, fontSize: 8, color: T.text3, marginTop: 2 }}>SCORE ▾</div>
        </div>
      </div>

      {open && (
        <div style={{ background: T.surface2, borderBottom: `1px solid ${T.border}`, padding: "12px 18px 14px" }}>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: T.text3, letterSpacing: "0.08em", marginBottom: 8 }}>SECCIONES DISPONIBLES</div>
          {sections.length === 0 && <div style={{ fontSize: 12, color: T.text3 }}>Sin secciones registradas.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {sections.map((s) => {
              const isAdded = added.has(s.id);
              const full = s.enrolled >= s.capacity;
              const pct = (s.enrolled / s.capacity) * 100;
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rMd, padding: "8px 12px" }}>
                  <div style={{ fontFamily: T.mono, fontSize: 9, color: T.text3, width: 56, flexShrink: 0 }}>{s.courseCode}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: T.text1 }}>{s.courseName} · Grupo {s.group}</div>
                    <div style={{ display: "flex", gap: 10, marginTop: 3 }}>
                      <span style={{ fontFamily: T.mono, fontSize: 9, color: T.red }}>{s.day} {s.startHour}:00–{s.endHour}:00</span>
                      <span style={{ fontSize: 10, color: T.text3 }}>{s.room}</span>
                    </div>
                    <div style={{ height: 3, background: T.surface3, borderRadius: 2, marginTop: 5, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: full ? T.red : pct > 70 ? T.amber : T.green }} />
                    </div>
                    <div style={{ fontFamily: T.mono, fontSize: 8, color: T.text3, marginTop: 2 }}>{s.enrolled}/{s.capacity} matriculados</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); !full && !isAdded && onAdd(s); }}
                    disabled={full || isAdded}
                    style={{
                      fontFamily: T.sans, fontSize: 11, fontWeight: 500,
                      color: isAdded ? T.green : full ? T.text3 : "#fff",
                      background: isAdded ? T.greenBg : full ? T.surface3 : T.red,
                      border: `1px solid ${isAdded ? "rgba(5,150,105,0.25)" : full ? T.border : T.red}`,
                      borderRadius: T.rMd, padding: "5px 12px",
                      cursor: full || isAdded ? "default" : "pointer",
                      opacity: full && !isAdded ? 0.45 : 1,
                      whiteSpace: "nowrap", transition: "all 0.12s",
                    }}
                  >
                    {isAdded ? "✓ Agregado" : full ? "Sin cupo" : "Agregar"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
