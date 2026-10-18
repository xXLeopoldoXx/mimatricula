import { useState } from "react";
import { Section, ALL_SECTIONS, DAYS, HOURS } from "../data";
import { T, COURSE_PALETTE } from "../theme";

interface Props {
  enrolledSections: Section[];
  onRemove: (id: string) => void;
  onAdd: (s: Section) => void;
}

function conflicts(sections: Section[], candidate: Section) {
  return sections.some(
    (s) => s.id !== candidate.id && s.day === candidate.day && s.startHour < candidate.endHour && candidate.startHour < s.endHour
  );
}

export default function ScheduleView({ enrolledSections, onRemove, onAdd }: Props) {
  const [filter, setFilter] = useState("");
  const [browser, setBrowser] = useState(false);

  const colorMap: Record<string, { bg: string; border: string; text: string }> = {};
  enrolledSections.forEach((s, i) => {
    if (!colorMap[s.courseCode]) colorMap[s.courseCode] = COURSE_PALETTE[i % COURSE_PALETTE.length];
  });

  const filtered = ALL_SECTIONS.filter(
    (s) => !filter || s.courseName.toLowerCase().includes(filter.toLowerCase()) || s.courseCode.toLowerCase().includes(filter.toLowerCase())
  );

  const credits = enrolledSections.reduce((a, s) => a + s.credits, 0);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 60px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text1, letterSpacing: "-0.01em" }}>Mi Horario</h1>
          <p style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>II Semestre 2025 · Ingeniería en Sistemas</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            display: "flex", gap: 20,
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: T.rLg, padding: "10px 20px",
          }}>
            <Stat label="Cursos" val={String(enrolledSections.length)} />
            <div style={{ width: 1, background: T.border }} />
            <Stat label="Créditos" val={String(credits)} warn={credits > 18} />
          </div>
          <button
            onClick={() => setBrowser((v) => !v)}
            style={{
              fontFamily: T.sans, fontSize: 13, fontWeight: 500,
              color: browser ? T.text2 : "#fff",
              background: browser ? T.surface : T.red,
              border: `1px solid ${browser ? T.border : T.red}`,
              borderRadius: T.rLg, padding: "10px 18px",
              cursor: "pointer", transition: "all 0.12s",
            }}
          >
            {browser ? "Cerrar catálogo" : "+ Agregar cursos"}
          </button>
        </div>
      </div>

      {/* Browser */}
      {browser && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rLg, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.text2, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10 }}>Catálogo de secciones</div>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar por nombre o código…"
            style={{
              width: "100%", marginBottom: 12,
              background: T.surface2, border: `1px solid ${T.border}`,
              borderRadius: T.rMd, padding: "8px 12px",
              fontSize: 13, color: T.text1, outline: "none",
              fontFamily: T.sans, transition: "border-color 0.12s",
            }}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = T.red; }}
            onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = T.border; }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 6, maxHeight: 300, overflowY: "auto" }}>
            {filtered.map((s) => {
              const enrolled = !!enrolledSections.find((e) => e.id === s.id);
              const conflict = !enrolled && conflicts(enrolledSections, s);
              const full = s.enrolled >= s.capacity;
              return <SectionRow key={s.id} section={s} enrolled={enrolled} conflict={conflict} full={full} onAdd={() => onAdd(s)} onRemove={() => onRemove(s.id)} />;
            })}
          </div>
        </div>
      )}

      {/* Grid */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rLg, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "52px repeat(6,1fr)" }}>
          {/* Header row */}
          <div style={{ background: T.surface2, borderBottom: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}` }} />
          {DAYS.map((d) => (
            <div key={d} style={{
              background: T.surface2,
              borderBottom: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}`,
              padding: "9px 0", textAlign: "center",
              fontFamily: T.mono, fontSize: 10, fontWeight: 500,
              color: T.text2, letterSpacing: "0.08em",
            }}>
              {d}
            </div>
          ))}

          {HOURS.map((h) => (
            <>
              <div key={`h${h}`} style={{
                borderBottom: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}`,
                padding: "7px 4px", textAlign: "center",
                fontFamily: T.mono, fontSize: 9, color: T.text3, alignSelf: "start", paddingTop: 9,
              }}>
                {h}:00
              </div>
              {DAYS.map((d) => {
                const cell = enrolledSections.find((s) => s.day === d && s.startHour === h);
                return (
                  <div key={`${h}${d}`} style={{
                    borderBottom: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}`,
                    minHeight: 52, padding: cell ? 3 : 0, position: "relative",
                  }}>
                    {cell && (
                      <div
                        className="cell-block"
                        style={{
                          background: colorMap[cell.courseCode]?.bg,
                          borderLeft: `3px solid ${colorMap[cell.courseCode]?.border}`,
                          borderRadius: T.rSm,
                          padding: "5px 7px",
                          height: `${(cell.endHour - cell.startHour) * 52 - 6}px`,
                          overflow: "hidden", position: "relative",
                        }}
                      >
                        <div style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 500, color: colorMap[cell.courseCode]?.text, letterSpacing: "0.06em" }}>
                          {cell.courseCode}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: T.text1, lineHeight: 1.3, marginTop: 2 }}>
                          {cell.courseName}
                        </div>
                        <div style={{ fontSize: 10, color: T.text2, marginTop: 2 }}>
                          {cell.professor.split(" ").slice(-1)[0]} · {cell.room}
                        </div>
                        <button
                          className="remove-btn"
                          onClick={() => onRemove(cell.id)}
                          style={{
                            position: "absolute", top: 4, right: 4,
                            background: "rgba(200,41,58,0.08)", border: "none", borderRadius: T.rSm,
                            color: T.red, fontSize: 9, cursor: "pointer",
                            padding: "1px 4px", opacity: 0, transition: "opacity 0.12s",
                          }}
                        >✕</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      <style>{`.cell-block:hover .remove-btn { opacity: 1 !important; }`}</style>

      {enrolledSections.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: T.text3 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🗓</div>
          <p style={{ fontSize: 13 }}>No tiene cursos matriculados. Use "+ Agregar cursos" o el Generador.</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, val, warn }: { label: string; val: string; warn?: boolean }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: warn ? T.amber : T.text1 }}>{val}</div>
      <div style={{ fontFamily: T.mono, fontSize: 9, color: T.text3, marginTop: 3, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function SectionRow({ section: s, enrolled, conflict, full, onAdd, onRemove }: {
  section: Section; enrolled: boolean; conflict: boolean; full: boolean;
  onAdd: () => void; onRemove: () => void;
}) {
  return (
    <div style={{
      background: enrolled ? T.redBg : T.surface2,
      border: `1px solid ${enrolled ? "rgba(200,41,58,0.25)" : conflict ? "rgba(200,41,58,0.2)" : T.border}`,
      borderRadius: T.rMd, padding: "9px 12px",
      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ fontFamily: T.mono, fontSize: 9, color: T.text3, letterSpacing: "0.06em" }}>{s.courseCode}-{s.group}</span>
          {conflict && <Chip text="CRUCE" color={T.red} />}
          {full && !enrolled && <Chip text="LLENO" color={T.amber} />}
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.text1 }}>{s.courseName}</div>
        <div style={{ fontSize: 11, color: T.text3, marginTop: 1 }}>
          {s.professor} · {s.day} {s.startHour}:00–{s.endHour}:00 · {s.room}
        </div>
      </div>
      <button
        onClick={enrolled ? onRemove : onAdd}
        disabled={!enrolled && (conflict || full)}
        style={{
          fontFamily: T.sans, fontSize: 12, fontWeight: 500,
          color: enrolled ? T.red : conflict || full ? T.text3 : "#fff",
          background: enrolled ? T.redBg : conflict || full ? T.surface3 : T.red,
          border: `1px solid ${enrolled ? "rgba(200,41,58,0.3)" : T.border}`,
          borderRadius: T.rMd, padding: "5px 12px",
          cursor: conflict || full ? "not-allowed" : "pointer",
          opacity: !enrolled && (conflict || full) ? 0.45 : 1,
          whiteSpace: "nowrap",
        }}
      >
        {enrolled ? "Quitar" : "Agregar"}
      </button>
    </div>
  );
}

function Chip({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      fontFamily: T.mono, fontSize: 8, fontWeight: 500,
      color, background: `${color}12`,
      border: `1px solid ${color}35`,
      borderRadius: T.rSm, padding: "1px 5px", letterSpacing: "0.07em",
    }}>{text}</span>
  );
}
