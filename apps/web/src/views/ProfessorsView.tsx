import { useState } from "react";
import { PROFESSORS, REVIEWS, Professor, Review } from "../data";
import { T } from "../theme";
import StarRating from "../components/StarRating";

const METRICS: { key: keyof Professor["ratings"]; label: string }[] = [
  { key: "clarity",     label: "Claridad"    },
  { key: "rigor",       label: "Exigencia"   },
  { key: "punctuality", label: "Puntualidad" },
  { key: "treatment",   label: "Trato"       },
];

interface Props { onNavigateToSchedule: () => void; }
interface Draft {
  clarity: number; rigor: number; punctuality: number; treatment: number;
  comment: string; course: string; wouldRecommend: boolean;
}

export default function ProfessorsView({ onNavigateToSchedule }: Props) {
  const [selected, setSelected] = useState<Professor | null>(null);
  const [reviews, setReviews]   = useState<Review[]>(REVIEWS);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sortBy, setSortBy]     = useState<"recommended" | keyof Professor["ratings"]>("recommended");
  const [draft, setDraft]       = useState<Draft>({ clarity: 0, rigor: 0, punctuality: 0, treatment: 0, comment: "", course: "", wouldRecommend: true });

  const sorted = [...PROFESSORS].sort((a, b) =>
    sortBy === "recommended" ? b.recommended - a.recommended : b.ratings[sortBy] - a.ratings[sortBy]
  );
  const profReviews = selected ? reviews.filter((r) => r.professorId === selected.id) : [];

  const submit = () => {
    if (!selected || !draft.course || draft.clarity === 0) return;
    setReviews((p) => [{ id: `r${Date.now()}`, professorId: selected.id, studentName: "Tú", semester: "II-2025", date: new Date().toISOString().slice(0,10), ...draft }, ...p]);
    setShowForm(false); setSubmitted(true);
    setDraft({ clarity: 0, rigor: 0, punctuality: 0, treatment: 0, comment: "", course: "", wouldRecommend: true });
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 60px", display: "flex", gap: 20, minHeight: "calc(100vh - 120px)" }}>

      {/* List */}
      <div style={{ width: 268, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text1 }}>Profesores</h2>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            style={{ fontFamily: T.mono, fontSize: 9, background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rSm, color: T.text2, padding: "3px 6px", cursor: "pointer", outline: "none", letterSpacing: "0.05em" }}
          >
            <option value="recommended">% REC.</option>
            <option value="clarity">CLARIDAD</option>
            <option value="rigor">EXIGENCIA</option>
            <option value="treatment">TRATO</option>
          </select>
        </div>

        {sorted.map((p, idx) => {
          const active = selected?.id === p.id;
          const avg = avgR(p);
          return (
            <button
              key={p.id}
              onClick={() => { setSelected(p); setSubmitted(false); setShowForm(false); }}
              style={{
                background: active ? T.surface : T.surface,
                border: `1px solid ${active ? T.red : T.border}`,
                borderLeft: `3px solid ${active ? T.red : "transparent"}`,
                borderRadius: T.rMd, padding: "11px 12px",
                cursor: "pointer", textAlign: "left", transition: "all 0.12s",
              }}
              onMouseOver={(e) => { if (!active) { (e.currentTarget as HTMLButtonElement).style.borderColor = T.borderMd; (e.currentTarget as HTMLButtonElement).style.background = T.surface2; } }}
              onMouseOut={(e)  => { if (!active) { (e.currentTarget as HTMLButtonElement).style.borderColor = T.border; (e.currentTarget as HTMLButtonElement).style.background = T.surface; } }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: active ? T.red : T.surface3,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 12,
                  color: active ? "#fff" : T.text2, flexShrink: 0,
                  border: `1px solid ${active ? T.red : T.border}`,
                }}>
                  {p.avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text1, lineHeight: 1.2 }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>{p.department}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <StarRating value={avg} size={10} />
                    <span style={{ fontFamily: T.mono, fontSize: 9, color: T.text3 }}>({p.reviewCount})</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: recC(p.recommended), marginLeft: "auto" }}>{p.recommended}%</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!selected ? (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: T.text3, gap: 8 }}>
            <div style={{ fontSize: 40 }}>👤</div>
            <p style={{ fontSize: 13 }}>Seleccione un docente para ver su perfil</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Prof card */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rLg, overflow: "hidden" }}>
              <div style={{ height: 3, background: T.red }} />
              <div style={{ padding: "20px 22px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%",
                    background: T.redBg, border: `1.5px solid rgba(200,41,58,0.3)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 17, color: T.red, flexShrink: 0,
                  }}>
                    {selected.avatar}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text3, letterSpacing: "0.08em", marginBottom: 5 }}>
                      DOCENTE · {selected.department.toUpperCase()}
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text1, letterSpacing: "-0.01em" }}>{selected.name}</h2>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                      {selected.tags.map((t) => (
                        <span key={t} style={{ fontSize: 11, background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 20, padding: "2px 10px", color: T.text2 }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{
                    textAlign: "center",
                    background: T.redBg, border: `1px solid rgba(200,41,58,0.2)`,
                    borderRadius: T.rLg, padding: "12px 18px", flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: T.red, lineHeight: 1 }}>{selected.recommended}%</div>
                    <div style={{ fontFamily: T.mono, fontSize: 9, color: T.text3, marginTop: 4, letterSpacing: "0.08em" }}>RECOMENDADO</div>
                    <div style={{ fontFamily: T.mono, fontSize: 9, color: T.text3, marginTop: 2 }}>{selected.reviewCount} reseñas</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginTop: 18, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                  {METRICS.map((m) => <MetricBar key={m.key} label={m.label} value={selected.ratings[m.key]} />)}
                </div>
              </div>
            </div>

            {/* Reviews header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: T.text1 }}>Reseñas ({profReviews.length})</h3>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              {!showForm && !submitted && (
                <button
                  onClick={() => setShowForm(true)}
                  style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 500, color: "#fff", background: T.red, border: "none", borderRadius: T.rMd, padding: "5px 14px", cursor: "pointer" }}
                >
                  + Dejar reseña
                </button>
              )}
            </div>

            {submitted && (
              <div style={{ background: T.greenBg, border: `1px solid rgba(5,150,105,0.25)`, borderRadius: T.rMd, padding: "10px 14px", fontSize: 13, color: T.green }}>
                ✓ Reseña registrada. Gracias por contribuir a la comunidad.
              </div>
            )}

            {showForm && (
              <ReviewForm courses={selected.courses} draft={draft} onChange={(p) => setDraft((prev) => ({ ...prev, ...p }))} onSubmit={submit} onCancel={() => setShowForm(false)} />
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {profReviews.length === 0 && !showForm && (
                <div style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: T.text3 }}>
                  Aún no hay reseñas para este docente.
                </div>
              )}
              {profReviews.map((r) => <ReviewCard key={r.id} review={r} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function avgR(p: Professor) {
  const v = Object.values(p.ratings);
  return v.reduce((a, b) => a + b, 0) / v.length;
}
function recC(pct: number) {
  return pct >= 85 ? T.green : pct >= 65 ? T.amber : T.red;
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const color = value >= 4.5 ? T.green : value >= 3.5 ? T.amber : T.red;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.text3, letterSpacing: "0.05em" }}>{label.toUpperCase()}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color }}>{value.toFixed(1)}</span>
      </div>
      <div style={{ height: 4, background: T.surface3, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${(value / 5) * 100}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

function ReviewCard({ review: r }: { review: Review }) {
  const avg = (r.clarity + r.rigor + r.punctuality + r.treatment) / 4;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rMd, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.text1 }}>{r.studentName}</span>
          <span style={{ fontFamily: T.mono, fontSize: 9, color: T.text3, marginLeft: 10, letterSpacing: "0.05em" }}>{r.course} · {r.semester}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StarRating value={avg} size={12} />
          <span style={{
            fontFamily: T.mono, fontSize: 9, letterSpacing: "0.06em",
            color: r.wouldRecommend ? T.green : T.red,
            background: r.wouldRecommend ? T.greenBg : T.redBg,
            border: `1px solid ${r.wouldRecommend ? "rgba(5,150,105,0.25)" : "rgba(200,41,58,0.25)"}`,
            borderRadius: 20, padding: "2px 8px",
          }}>
            {r.wouldRecommend ? "✓ RECOMIENDA" : "✕ NO RECOMIENDA"}
          </span>
        </div>
      </div>
      <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.65 }}>{r.comment}</p>
      <div style={{ display: "flex", gap: 14, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
        {METRICS.map((m) => (
          <div key={m.key} style={{ fontFamily: T.mono, fontSize: 9, color: T.text3, letterSpacing: "0.04em" }}>
            {m.label.slice(0,3).toUpperCase()}: <span style={{ color: T.text2, fontWeight: 500 }}>{r[m.key]}/5</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewForm({ courses, draft, onChange, onSubmit, onCancel }: {
  courses: string[]; draft: Draft;
  onChange: (p: Partial<Draft>) => void;
  onSubmit: () => void; onCancel: () => void;
}) {
  const field = { background: T.surface2, border: `1px solid ${T.border}`, borderRadius: T.rMd, padding: "8px 12px", fontSize: 13, color: T.text1, outline: "none", fontFamily: T.sans, width: "100%" };
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rLg, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.text1 }}>Nueva reseña</div>

      <div>
        <Label>Curso</Label>
        <select value={draft.course} onChange={(e) => onChange({ course: e.target.value })} style={{ ...field, cursor: "pointer" }}>
          <option value="">Seleccione un curso…</option>
          {courses.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
        {METRICS.map((m) => (
          <div key={m.key}>
            <Label>{m.label}</Label>
            <StarRating value={draft[m.key]} size={22} interactive onChange={(v) => onChange({ [m.key]: v })} />
          </div>
        ))}
      </div>

      <div>
        <Label>Comentario</Label>
        <textarea rows={3} value={draft.comment} onChange={(e) => onChange({ comment: e.target.value })} placeholder="Comparta su experiencia…" style={{ ...field, resize: "vertical" }} />
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <input type="checkbox" checked={draft.wouldRecommend} onChange={(e) => onChange({ wouldRecommend: e.target.checked })} style={{ accentColor: T.red }} />
        <span style={{ fontSize: 13, color: T.text2 }}>Recomendaría a este docente</span>
      </label>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4, borderTop: `1px solid ${T.border}` }}>
        <button onClick={onCancel} style={{ fontFamily: T.sans, fontSize: 12, color: T.text2, background: T.surface2, border: `1px solid ${T.border}`, borderRadius: T.rMd, padding: "7px 16px", cursor: "pointer" }}>Cancelar</button>
        <button onClick={onSubmit} style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: "#fff", background: T.red, border: "none", borderRadius: T.rMd, padding: "7px 18px", cursor: "pointer" }}>Enviar reseña</button>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text3, letterSpacing: "0.06em", marginBottom: 5, textTransform: "uppercase" }}>{children}</div>;
}
