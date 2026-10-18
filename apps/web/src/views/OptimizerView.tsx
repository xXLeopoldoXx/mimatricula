import { useState } from "react";
import { Section, ALL_SECTIONS, COURSE_NAMES } from "../data";
import { T, COURSE_PALETTE } from "../theme";

interface Props { enrolledSections: Section[]; onApply: (ss: Section[]) => void; }
interface Combo { sections: Section[]; score: number; credits: number; label: string; }

function clash(a: Section, b: Section) { return a.day === b.day && a.startHour < b.endHour && b.startHour < a.endHour; }
function clean(ss: Section[]) {
  for (let i = 0; i < ss.length; i++) for (let j = i + 1; j < ss.length; j++) if (clash(ss[i], ss[j])) return false;
  return true;
}
const SCORES: Record<string, number> = { p1: 4.65, p2: 4.05, p3: 4.475, p4: 4.075, p5: 4.55, p6: 3.975 };
function score(ss: Section[]) {
  const prof = ss.reduce((a, s) => a + (SCORES[s.professorId] ?? 4), 0) / ss.length;
  const days = new Set(ss.map((s) => s.day)).size;
  const avail = ss.reduce((a, s) => a + (s.capacity - s.enrolled) / s.capacity, 0) / ss.length;
  return prof * 0.6 + (days <= 4 ? 1 : days <= 5 ? 0.82 : 0.65) * 0.2 + avail * 0.2;
}
function generate(selected: string[]): Combo[] {
  const byC: Record<string, Section[]> = {};
  for (const c of selected) {
    const secs = ALL_SECTIONS.filter((s) => s.courseName === c && s.enrolled < s.capacity);
    if (!secs.length) return [];
    byC[c] = secs;
  }
  let combos: Section[][] = [[]];
  for (const c of Object.keys(byC)) {
    const next: Section[][] = [];
    for (const ex of combos) for (const s of byC[c]) { const cand = [...ex, s]; if (clean(cand)) next.push(cand); }
    combos = next;
  }
  return combos
    .map((ss) => ({ sections: ss, score: score(ss), credits: ss.reduce((a, s) => a + s.credits, 0), label: "" }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((c, i) => ({ ...c, label: ["Opción Principal", "Alternativa I", "Alternativa II"][i] }));
}

export default function OptimizerView({ onApply }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [combos, setCombos]     = useState<Combo[]>([]);
  const [generated, setGenerated] = useState(false);
  const [appliedIdx, setAppliedIdx] = useState<number | null>(null);

  const toggle = (c: string) => { setSelected((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c]); setCombos([]); setGenerated(false); setAppliedIdx(null); };
  const run = () => { setCombos(generate(selected)); setGenerated(true); setAppliedIdx(null); };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 60px", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text1, letterSpacing: "-0.01em" }}>Generador de Horarios</h1>
        <p style={{ fontSize: 13, color: T.text3, marginTop: 4 }}>Seleccione los cursos a matricular y el sistema generará combinaciones sin cruces.</p>
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* Sidebar */}
        <div style={{ width: 248, flexShrink: 0, background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rLg, overflow: "hidden" }}>
          <div style={{ padding: "11px 14px", background: T.surface2, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text3, letterSpacing: "0.08em" }}>OFERTA ACADÉMICA</div>
          </div>
          <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: 3 }}>
            {COURSE_NAMES.map((c) => {
              const on = selected.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggle(c)}
                  style={{
                    background: on ? T.redBg : "transparent",
                    border: `1px solid ${on ? "rgba(200,41,58,0.25)" : "transparent"}`,
                    borderRadius: T.rMd, padding: "8px 10px",
                    textAlign: "left", cursor: "pointer", transition: "all 0.11s",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}
                  onMouseOver={(e) => { if (!on) (e.currentTarget as HTMLButtonElement).style.background = T.surface2; }}
                  onMouseOut={(e)  => { if (!on) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 13, color: on ? T.red : T.text1, fontWeight: on ? 500 : 400 }}>{c}</span>
                  {on && <span style={{ fontSize: 11, color: T.red }}>✓</span>}
                </button>
              );
            })}
          </div>
          <div style={{ padding: "12px", borderTop: `1px solid ${T.border}` }}>
            <button
              onClick={run}
              disabled={selected.length === 0}
              style={{
                fontFamily: T.sans, fontSize: 13, fontWeight: 600,
                color: "#fff", background: selected.length > 0 ? T.red : T.borderMd,
                border: "none", borderRadius: T.rMd, padding: "10px",
                width: "100%", cursor: selected.length === 0 ? "not-allowed" : "pointer",
                opacity: selected.length === 0 ? 0.5 : 1, transition: "all 0.12s",
              }}
            >
              Generar horarios ({selected.length})
            </button>
          </div>
        </div>

        {/* Results */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          {!generated && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 260, gap: 8, color: T.text3 }}>
              <div style={{ fontSize: 40 }}>🗓</div>
              <p style={{ fontSize: 13 }}>Seleccione cursos y presione "Generar horarios"</p>
            </div>
          )}
          {generated && combos.length === 0 && (
            <div style={{ background: T.redBg, border: `1px solid rgba(200,41,58,0.25)`, borderRadius: T.rMd, padding: "18px", textAlign: "center", fontSize: 13, color: T.red }}>
              No se encontraron combinaciones sin cruce. Intente con menos cursos.
            </div>
          )}
          {combos.map((combo, idx) => {
            const applied = appliedIdx === idx;
            return (
              <div key={idx} style={{ background: T.surface, border: `1px solid ${applied ? T.red : T.border}`, borderRadius: T.rLg, overflow: "hidden" }}>
                <div style={{ background: T.surface2, borderBottom: `1px solid ${T.border}`, padding: "11px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: idx === 0 ? T.red : T.text2, background: idx === 0 ? T.redBg : T.surface3, border: `1px solid ${idx === 0 ? "rgba(200,41,58,0.25)" : T.border}`, borderRadius: T.rMd, padding: "3px 10px" }}>
                      {combo.label}
                    </span>
                    <span style={{ fontFamily: T.mono, fontSize: 10, color: T.text3 }}>
                      {combo.credits} cr · Puntaje: {(combo.score * 20).toFixed(1)}/20
                    </span>
                  </div>
                  <button
                    onClick={() => { onApply(combo.sections); setAppliedIdx(idx); }}
                    style={{
                      fontFamily: T.sans, fontSize: 12, fontWeight: 600,
                      color: applied ? T.red : "#fff",
                      background: applied ? T.redBg : T.red,
                      border: `1px solid ${applied ? "rgba(200,41,58,0.3)" : T.red}`,
                      borderRadius: T.rMd, padding: "6px 16px", cursor: "pointer", transition: "all 0.12s",
                    }}
                  >
                    {applied ? "✓ Aplicado" : "Aplicar horario"}
                  </button>
                </div>

                {/* Table */}
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "72px 1fr 150px 130px 36px", padding: "6px 16px", background: T.surface2, borderBottom: `1px solid ${T.border}` }}>
                    {["CÓDIGO","CURSO","DOCENTE","HORARIO","CR"].map((h) => (
                      <div key={h} style={{ fontFamily: T.mono, fontSize: 9, color: T.text3, letterSpacing: "0.08em" }}>{h}</div>
                    ))}
                  </div>
                  {combo.sections.map((s, si) => (
                    <div key={s.id} style={{
                      display: "grid", gridTemplateColumns: "72px 1fr 150px 130px 36px",
                      padding: "10px 16px", borderBottom: si < combo.sections.length - 1 ? `1px solid ${T.border}` : "none", alignItems: "center",
                    }}>
                      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text3 }}>{s.courseCode}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: T.text1 }}>{s.courseName}</div>
                      <div style={{ fontSize: 12, color: T.text2 }}>{s.professor.split(" ").slice(-1)[0]}</div>
                      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.red }}>{s.day} {s.startHour}:00–{s.endHour}:00</div>
                      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text3 }}>{s.credits}</div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: "10px 16px 14px" }}><MiniGrid sections={combo.sections} /></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MiniGrid({ sections }: { sections: Section[] }) {
  const days = ["Lun","Mar","Mié","Jue","Vie"];
  const cMap: Record<string, string> = {};
  sections.forEach((s, i) => { if (!cMap[s.courseCode]) cMap[s.courseCode] = COURSE_PALETTE[i % COURSE_PALETTE.length].border; });
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: T.rSm, overflow: "hidden", display: "grid", gridTemplateColumns: "30px repeat(5,1fr)" }}>
      <div style={{ background: T.surface2 }} />
      {days.map((d) => <div key={d} style={{ background: T.surface2, padding: "3px 2px", textAlign: "center", fontFamily: T.mono, fontSize: 8, color: T.text3, letterSpacing: "0.05em" }}>{d}</div>)}
      {Array.from({ length: 12 }, (_, i) => i + 7).map((h) => (
        <>
          <div key={`h${h}`} style={{ padding: "2px 3px", fontSize: 7, color: T.text3, fontFamily: T.mono, textAlign: "right", background: T.surface2, borderTop: `1px solid ${T.border}` }}>{h}</div>
          {days.map((d) => {
            const s = sections.find((sec) => sec.day === d && sec.startHour === h);
            const c = s ? cMap[s.courseCode] : null;
            return (
              <div key={`${h}${d}`} style={{ minHeight: 14, background: c ? `${c}12` : T.surface2, borderLeft: c ? `2px solid ${c}` : "none", borderTop: `1px solid ${T.border}`, fontSize: 7, color: c ?? "transparent", padding: "1px 2px", fontFamily: T.mono, overflow: "hidden", whiteSpace: "nowrap" }}>
                {s?.courseCode}
              </div>
            );
          })}
        </>
      ))}
    </div>
  );
}
