// Genera la oferta de matrícula ficticia y las reseñas de simulación.
// Es determinista (semilla fija): correrlo dos veces produce los mismos archivos.
// Uso: pnpm gen:data
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(here, "../data");
const PORTAL_PUBLIC = resolve(here, "../../../apps/portal-mock/public/api");

// PRNG con semilla (mulberry32)
let seed = 20261018;
function rand() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ── Docentes (nombres ficticios) ───────────────────────────────────────────
const PROFESSORS = [
  ["Mg. Rosa Quispe Huamán", "Humanidades"],
  ["Lic. Carlos Mendoza Ríos", "Humanidades"],
  ["Mg. Patricia Salazar Vega", "Humanidades"],
  ["Lic. Jorge Alvarado Paz", "Humanidades"],
  ["Lic. Andrea Torres Lazo", "Idiomas"],
  ["Lic. Kevin Ramírez Soto", "Idiomas"],
  ["Mg. Lucía Fernández Ccori", "Idiomas"],
  ["Ing. Miguel Castillo Rojas", "Ingeniería Industrial"],
  ["Mg. Diana Paredes Luna", "Ingeniería Industrial"],
  ["Ing. Renzo Gutiérrez Chávez", "Ingeniería Industrial"],
  ["Mg. Silvia Campos Arce", "Ingeniería Industrial"],
  ["Ing. Luis Herrera Mamani", "Computación"],
  ["Mg. Karen Villanueva Díaz", "Computación"],
  ["Ing. Óscar Medina Flores", "Computación"],
  ["Dr. Alberto Núñez Cárdenas", "Ciencias Básicas"],
  ["Mg. Elena Rojas Palomino", "Ciencias Básicas"],
  ["Lic. Fernando Cruz Aguilar", "Ciencias Básicas"],
  ["Mg. Gabriela Ortiz Benites", "Ciencias Básicas"],
  ["Dra. Mónica Espinoza Lara", "Química"],
  ["Ing. Raúl Sánchez Yupanqui", "Química"],
  ["Mg. Verónica León Tapia", "Química"],
  ["Ing. Daniel Vargas Inga", "Dibujo y Diseño"],
  ["Arq. Claudia Morales Prado", "Dibujo y Diseño"],
  ["Mg. Hugo Cabrera Salas", "Economía"],
  ["Mg. Natalia Ruiz Delgado", "Economía"],
  // Docentes añadidos para los cursos de los ciclos 1 a 10 (ids nuevos, los anteriores no cambian)
  ["Mg. Teresa Bustamante Orna", "Humanidades"],
  ["Lic. Marco Zevallos Pinedo", "Humanidades"],
  ["Mg. Ximena Aguirre Soto", "Idiomas"],
  ["Mg. Julio Taboada Vera", "Ciencias Básicas"],
  ["Dra. Beatriz Montalvo Neyra", "Ciencias Básicas"],
  ["Ing. Alex Cornejo Bravo", "Computación"],
  ["Mg. Paola Echegaray Ruiz", "Computación"],
  ["Ing. Sergio Vilca Mendoza", "Computación"],
  ["Mg. Daniela Arana Cueva", "Computación"],
  ["Mg. Iván Poma Challco", "Física"],
  ["Dr. Ricardo Valdivia Ames", "Física"],
  ["Ing. Lourdes Cáceres Pino", "Física"],
  ["Mg. Fabiola Santander Rey", "Sistemas e Informática"],
  ["Ing. Gonzalo Pacheco Lira", "Sistemas e Informática"],
  ["Mg. Cecilia Ugarte Paz", "Sistemas e Informática"],
  ["Ing. Bruno Escalante Vidal", "Sistemas e Informática"],
  ["Mg. Omar Delgado Huerta", "Sistemas e Informática"],
  ["Dra. Rocío Almeyda Tello", "Sistemas e Informática"],
  ["Mg. Ernesto Salinas Cabello", "Gestión y Negocios"],
  ["Mg. Valeria Neira Coronado", "Gestión y Negocios"],
  ["Ing. Mauricio Linares Bedoya", "Gestión y Negocios"],
  ["Mg. Stefany Rivas Quiroz", "Gestión y Negocios"],
  ["Dr. Humberto Ccama Luque", "Investigación"],
  ["Mg. Alejandra Ponce Ferro", "Investigación"],
  ["Mg. Joaquín Ibáñez Roca", "Investigación"],
].map(([name, department], i) => ({ id: `doc-${String(i + 1).padStart(2, "0")}`, name, department }));

// ── Cursos (basados en la captura del portal) ──────────────────────────────
// [código, nombre, horas semanales, créditos, ciclo, tipo, repetido, departamento]
const COURSES_RAW = [
  ["1X101", "Nivelación De Redacción", 4, 4, "00", "OBLIGATORIO", true, "Humanidades"],
  ["1N03I", "Inglés I", 3, 3, "01", "OBLIGATORIO", false, "Idiomas"],
  ["1IN06", "Introducción A La Ingeniería Industrial", 2, 2, "01", "OBLIGATORIO", false, "Ingeniería Industrial"],
  ["1N07C", "Ciudadanía Y Reflexión Ética", 3, 3, "01", "OBLIGATORIO", false, "Humanidades"],
  ["1VU01", "Introducción A La Vida Universitaria", 2, 2, "01", "OBLIGATORIO", false, "Humanidades"],
  ["1I05N", "Dibujo Para Ingeniería", 3, 2, "02", "OBLIGATORIO", false, "Dibujo y Diseño"],
  ["1I07N", "Principios De Algoritmos", 2, 2, "02", "OBLIGATORIO", false, "Computación"],
  ["1I0N3", "Matemática II", 4, 4, "02", "OBLIGATORIO", false, "Ciencias Básicas"],
  ["1Q01G", "Química General", 3.44, 2.72, "02", "OBLIGATORIO", false, "Química"],
  ["1L02Q", "Laboratorio De Química General", 0.56, 0.28, "02", "OBLIGATORIO", false, "Química"],
  ["1I04N", "Herramientas Informáticas Para La Toma De Decisiones", 2, 2, "03", "OBLIGATORIO", false, "Computación"],
  ["1S10L", "Economía Ambiental Y Sostenibilidad", 3, 3, "06", "ELECTIVO", false, "Economía"],
];

// ── Cursos de los ciclos 1 a 10 (plan de estudios) ─────────────────────────
// El ciclo 7 no está en la lista de origen y no se inventa. Los cursos que ya existen arriba
// (mismo nombre normalizado) se omiten para no duplicarlos.
const CURRICULUM = {
  "01": [
    ["Principios de Algoritmos", "Computación"],
    ["Introducción a la Vida Universitaria", "Humanidades"],
    ["Matemática 1", "Ciencias Básicas"],
    ["Comprensión y Redacción de Textos 1", "Humanidades"],
    ["Individuo y Medio Ambiente", "Humanidades"],
    ["Inglés 1", "Idiomas"],
  ],
  "02": [
    ["Introducción a las TIC", "Sistemas e Informática"],
    ["Matemática Discreta", "Ciencias Básicas"],
    ["Matemática 2", "Ciencias Básicas"],
    ["Problemas y Desafíos en el Perú Actual", "Humanidades"],
    ["Comprensión y Redacción de Textos 2", "Humanidades"],
    ["Estadística Descriptiva y Probabilidades", "Ciencias Básicas"],
    ["Inglés 2", "Idiomas"],
  ],
  "03": [
    ["Taller de Programación", "Computación"],
    ["Ciudadanía y Reflexión Ética", "Humanidades"],
    ["Cálculo 1", "Ciencias Básicas"],
    ["Estadística Inferencial", "Ciencias Básicas"],
    ["Mecánica Clásica", "Física"],
    ["Laboratorio de Mecánica Clásica", "Física", "lab"],
    ["Inglés 3", "Idiomas"],
  ],
  "04": [
    ["Programación Orientada a Objetos", "Computación"],
    ["Análisis y Diseño de Algoritmos", "Computación"],
    ["Cálculo 2", "Ciencias Básicas"],
    ["Investigación Académica", "Investigación"],
    ["Base de Datos", "Sistemas e Informática"],
    ["Fundamentos de Electromagnetismo", "Física"],
    ["Laboratorio de Fundamentos de Electromagnetismo", "Física", "lab"],
    ["Inglés 4", "Idiomas"],
  ],
  "05": [
    ["Algoritmos y Estructuras de Datos", "Computación"],
    ["Diseño de Patrones", "Computación"],
    ["Taller de Programación Web", "Computación"],
    ["Redes y Comunicación de Datos 1", "Sistemas e Informática"],
    ["Sistemas Operativos", "Sistemas e Informática"],
    ["Herramientas Informáticas para la Toma de Decisiones", "Computación"],
    ["Base de Datos 2", "Sistemas e Informática"],
  ],
  "06": [
    ["Análisis y Diseño de Sistemas de Información", "Sistemas e Informática"],
    ["Java Script Avanzado", "Computación"],
    ["Marcos de Desarrollo Web", "Computación"],
    ["Hoja de Estilo en Cascada Avanzado", "Computación"],
    ["Gestión de Proyectos", "Gestión y Negocios"],
    ["Administración y Organización de Empresas", "Gestión y Negocios"],
    ["Curso Integrador 1: Sistemas - Software", "Sistemas e Informática"],
  ],
  "08": [
    ["Herramientas para la Comunicación Efectiva", "Humanidades"],
    ["Innovación y Transformación Digital", "Gestión y Negocios"],
    ["Herramientas de Prototipado", "Computación"],
    ["Negociación y Narrativa", "Gestión y Negocios"],
    ["Diseño e Implementación de Arquitectura Empresarial", "Sistemas e Informática"],
    ["Gestión del Servicio TI", "Sistemas e Informática"],
    ["Inteligencia de Negocios", "Sistemas e Informática"],
  ],
  "09": [
    ["Formación para la Investigación - Sistemas", "Investigación"],
    ["Interacción Hombre Máquina", "Sistemas e Informática"],
    ["Curso Integrador 2: Sistemas", "Sistemas e Informática"],
    ["Planeamiento Estratégico de las TICs", "Gestión y Negocios"],
    ["Sistemas de Información Empresarial", "Sistemas e Informática"],
    ["Gestión del Conocimiento", "Gestión y Negocios"],
  ],
  "10": [
    ["Ética Profesional", "Humanidades"],
    ["Herramientas de Desarrollo Profesional - TIC", "Sistemas e Informática"],
    ["Formación para la Empleabilidad", "Gestión y Negocios"],
    ["Servicios Cloud", "Sistemas e Informática"],
    ["Ingeniería Económica", "Gestión y Negocios"],
  ],
};

// Misma lógica que courseKey de @mimatricula/shared (sin tildes, sin conectores, romanos a dígitos).
const STOP = new Set(["de", "del", "la", "las", "el", "los", "y", "e", "a", "para", "en"]);
const ROMAN = { i: "1", ii: "2", iii: "3", iv: "4", v: "5" };
const courseKey = (name) =>
  name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t))
    .map((t) => ROMAN[t] ?? t)
    .join(" ");
const titleCase = (name) =>
  name
    .split(" ")
    .map((w) => (/^(TIC|TICs|TI)$/.test(w) || /^\d|^[-:]/.test(w) ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");

const knownKeys = new Set(COURSES_RAW.map((c) => courseKey(c[1])));
for (const [cycle, list] of Object.entries(CURRICULUM)) {
  list.forEach(([name, dept, kind], i) => {
    const key = courseKey(name);
    if (knownKeys.has(key)) return;
    knownKeys.add(key);
    const lab = kind === "lab";
    COURSES_RAW.push([`C${cycle}${String(i + 1).padStart(2, "0")}`, titleCase(name), lab ? 0.8 : 3, lab ? 0.4 : 3, cycle, "OBLIGATORIO", false, dept]);
  });
}
const courses = COURSES_RAW.map(([code, name, weeklyHours, credits, cycle, type, repeated]) => ({
  code,
  name,
  weeklyHours,
  credits,
  cycle,
  type,
  repeated,
}));

// ── Secciones ──────────────────────────────────────────────────────────────
const SLOTS = ["07:00", "08:30", "10:15", "12:00", "13:45", "15:30", "17:15", "19:00", "20:45"];
const NIGHT = new Set(["19:00", "20:45"]);
const WEEKDAYS = ["LUN", "MAR", "MIE", "JUE", "VIE"];
const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const toHHMM = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Bloques de 45 min (hora académica). 4 h -> 2 sesiones de 90 min; 3 h -> 1 de 135. */
function sessionPlan(hours) {
  const h = Math.max(1, Math.round(hours));
  if (h >= 4) return [90, 90];
  if (h === 3) return [135];
  return [90];
}

const BUILDINGS = ["A", "B", "C", "D", "E"];
const sections = [];
const usedCodes = new Set();
const nextCode = () => {
  let c;
  do c = String(int(30000, 49999));
  while (usedCodes.has(c));
  usedCodes.add(c);
  return c;
};

for (const [code, , hours, , , , , dept] of COURSES_RAW) {
  const pool = shuffle(PROFESSORS.filter((p) => p.department === dept));
  const teachers = pool.slice(0, Math.min(pool.length, int(3, 4)));
  const total = code.startsWith("C") ? int(4, 6) : int(7, 10);
  const plan = sessionPlan(hours);
  const isLab = hours < 1;
  for (let i = 0; i < total; i++) {
    // ~30 % de las secciones en la noche para que el filtro por turno tenga sentido
    const night = i < Math.round(total * 0.3);
    const slot = night ? pick([...NIGHT]) : pick(SLOTS.filter((s) => !NIGHT.has(s)));
    const days = shuffle(WEEKDAYS.concat(rand() < 0.15 ? ["SAB"] : [])).slice(0, plan.length);
    const room = `${pick(BUILDINGS)}-${int(1, 6)}${String(int(1, 15)).padStart(2, "0")}`;
    const sessions = plan
      .map((dur, k) => {
        const start = slot;
        const end = toHHMM(Math.min(toMin(start) + dur, 23 * 60));
        return { day: days[k], start, end, room: isLab ? `LAB-${int(1, 4)}` : room };
      })
      .sort((a, b) => WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day));
    const capacity = isLab ? 24 : pick([35, 40, 45]);
    const enrolled = rand() < 0.12 ? capacity : int(Math.floor(capacity * 0.2), capacity - 1);
    const teacher = teachers[i % teachers.length];
    sections.push({
      code: nextCode(),
      courseCode: code,
      shift: NIGHT.has(slot) ? "NOCHE" : "MANANA",
      modality: rand() < 0.15 ? "VIRTUAL" : "PRESENCIAL",
      professorId: teacher.id,
      professorName: teacher.name,
      sessions,
      capacity,
      enrolled,
    });
  }
}

const offer = {
  university: "Universidad Tecnológica del Perú (simulación)",
  term: "2027-1",
  student: { code: "U00000000", name: "Estudiante Demo" },
  courses,
  sections,
  professors: PROFESSORS,
};

// ── Reseñas de simulación ──────────────────────────────────────────────────
const COMMENTS = {
  high: [
    "Explica con mucha claridad y siempre resuelve dudas al final de la clase.",
    "Sus clases son dinámicas, usa ejemplos reales y se nota que le gusta enseñar.",
    "Muy puntual y organizado, el sílabo se cumple al pie de la letra.",
    "Exigente pero justo, si estudias aprendes de verdad.",
    "Responde los correos rápido y da retroalimentación en cada entrega.",
    "Lo recomiendo totalmente, sus materiales en Canvas son muy completos.",
    "Cada clase termina con un resumen y una práctica corta, así no te pierdes.",
    "Se toma el tiempo de explicar de nuevo si alguien no entendió, sin hacerte sentir mal.",
    "Los exámenes son parecidos a las prácticas, no hay sorpresas y se aprende bastante.",
    "Te motiva a participar y da puntos extra por proponer ejemplos propios.",
    "Muy buen trato, abre espacios de consulta fuera de horario por Teams.",
    "Con él entendí por fin el tema que me había costado en otros ciclos.",
    "Sube las diapositivas y grabaciones a tiempo, ideal si trabajas.",
    "Evalúa con rúbricas claras y explica cada nota cuando se lo piden.",
  ],
  mid: [
    "Sabe mucho del curso, pero a veces avanza muy rápido.",
    "Las clases son algo monótonas, aunque los exámenes son coherentes con lo enseñado.",
    "Buena persona, pero llega tarde con frecuencia.",
    "Califica estricto; conviene revisar bien las rúbricas.",
    "Cumple, aunque podría usar más ejemplos prácticos.",
    "Explica bien cuando le preguntas, pero en clase se limita a leer las diapositivas.",
    "Deja bastante trabajo autónomo; si organizas tu tiempo se puede aprobar sin problema.",
    "Las prácticas son más difíciles que lo visto en clase, hay que prepararse aparte.",
    "Es amable, pero tarda en publicar las notas y eso complica planificar.",
    "El curso se pasa con constancia, aunque la primera mitad es lenta y la segunda muy cargada.",
    "Pide mucho trabajo en grupo; depende de con quién te toque.",
  ],
  low: [
    "Cuesta seguirle el ritmo y casi no resuelve dudas.",
    "Los exámenes no tienen relación con lo que se ve en clase.",
    "Cancela clases sin avisar y demora mucho en subir notas.",
    "Poca paciencia con las preguntas, el ambiente en clase es tenso.",
    "Cambia las fechas de evaluación a último momento y no responde correos.",
    "Se nota poca preparación de las sesiones, mucho tiempo se va en recordar temas.",
    "Las notas no coinciden con las rúbricas y es difícil pedir una revisión.",
  ],
};
const TAGS = {
  high: ["Explica bien", "Muy paciente", "Puntual", "Clases dinámicas", "Buen material", "Justo al calificar"],
  mid: ["Exigente", "Avanza rápido", "Mucha teoría", "Rúbricas estrictas", "Mucho trabajo autónomo", "Trabajos grupales"],
  low: ["Difícil de seguir", "Poco puntual", "Exámenes difíciles", "Poca retroalimentación"],
};
const TERMS = ["2025-1", "2025-2", "2026-1", "2026-2"];
const coursesByProf = new Map();
for (const s of sections) {
  if (!coursesByProf.has(s.professorId)) coursesByProf.set(s.professorId, new Set());
  coursesByProf.get(s.professorId).add(s.courseCode);
}

const reviews = [];
let rid = 1;
for (const prof of PROFESSORS) {
  const taught = [...(coursesByProf.get(prof.id) ?? [])];
  if (!taught.length) continue;
  const quality = 2.4 + rand() * 2.5; // calidad "real" del docente, 2.4–4.9
  const rigorBase = 2.5 + rand() * 2.5;
  const count = int(5, 11);
  for (let i = 0; i < count; i++) {
    const noise = () => (rand() - 0.5) * 1.6;
    const score = (base) => clamp(Math.round(base + noise()), 1, 5);
    const clarity = score(quality);
    const punctuality = score(quality + 0.3);
    const treatment = score(quality + 0.1);
    const rigor = score(rigorBase);
    const avg = (clarity + punctuality + treatment) / 3;
    const tier = avg >= 4 ? "high" : avg >= 3 ? "mid" : "low";
    const term = pick(TERMS);
    const [year, half] = term.split("-");
    const month = half === "1" ? int(4, 7) : int(9, 12);
    reviews.push({
      id: `rev-${String(rid++).padStart(3, "0")}`,
      professorId: prof.id,
      courseCode: pick(taught),
      term,
      clarity,
      rigor,
      punctuality,
      treatment,
      wouldRecommend: avg >= 3.5 ? rand() < 0.92 : rand() < 0.2,
      comment: pick(COMMENTS[tier]),
      tags: shuffle(TAGS[tier]).slice(0, int(1, 2)),
      createdAt: `${year}-${String(month).padStart(2, "0")}-${String(int(1, 28)).padStart(2, "0")}T12:00:00.000Z`,
      demo: true,
    });
  }
}

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(PORTAL_PUBLIC, { recursive: true });
writeFileSync(resolve(OUT_DIR, "oferta.json"), JSON.stringify(offer, null, 2) + "\n");
writeFileSync(resolve(OUT_DIR, "resenas.json"), JSON.stringify(reviews, null, 2) + "\n");
// El portal ficticio sirve la oferta como si fuera su API interna
writeFileSync(resolve(PORTAL_PUBLIC, "oferta.json"), JSON.stringify(offer, null, 2) + "\n");

console.log(
  `Generado: ${courses.length} cursos, ${sections.length} secciones, ${PROFESSORS.length} docentes, ${reviews.length} reseñas`,
);
