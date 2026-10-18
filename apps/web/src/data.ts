export type Day = "Lun" | "Mar" | "Mié" | "Jue" | "Vie" | "Sáb";
export const DAYS: Day[] = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am–8pm

export interface Section {
  id: string;
  courseCode: string;
  courseName: string;
  professor: string;
  professorId: string;
  group: string;
  credits: number;
  day: Day;
  startHour: number;
  endHour: number;
  room: string;
  enrolled: number;
  capacity: number;
}

export interface Professor {
  id: string;
  name: string;
  department: string;
  avatar: string;
  courses: string[];
  ratings: {
    clarity: number;
    rigor: number;
    punctuality: number;
    treatment: number;
  };
  reviewCount: number;
  recommended: number; // percentage
  tags: string[];
}

export interface Review {
  id: string;
  professorId: string;
  studentName: string;
  course: string;
  semester: string;
  clarity: number;
  rigor: number;
  punctuality: number;
  treatment: number;
  comment: string;
  wouldRecommend: boolean;
  date: string;
}

export const PROFESSORS: Professor[] = [
  {
    id: "p1",
    name: "Dra. Carmen Solís",
    department: "Ingeniería en Sistemas",
    avatar: "CS",
    courses: ["Estructuras de Datos", "Algoritmos", "Programación I"],
    ratings: { clarity: 4.7, rigor: 4.2, punctuality: 4.9, treatment: 4.8 },
    reviewCount: 84,
    recommended: 94,
    tags: ["Muy organizada", "Exigente", "Explica bien"],
  },
  {
    id: "p2",
    name: "MSc. Rodrigo Vargas",
    department: "Matemáticas",
    avatar: "RV",
    courses: ["Cálculo I", "Cálculo II", "Álgebra Lineal"],
    ratings: { clarity: 3.8, rigor: 4.9, punctuality: 4.0, treatment: 3.5 },
    reviewCount: 112,
    recommended: 71,
    tags: ["Muy difícil", "Buen contenido", "Poco flexible"],
  },
  {
    id: "p3",
    name: "Lic. Andrea Mora",
    department: "Ingeniería en Sistemas",
    avatar: "AM",
    courses: ["Bases de Datos", "Diseño de Software", "Programación II"],
    ratings: { clarity: 4.5, rigor: 3.9, punctuality: 4.6, treatment: 4.9 },
    reviewCount: 67,
    recommended: 91,
    tags: ["Muy amable", "Proyectos interesantes", "Justa"],
  },
  {
    id: "p4",
    name: "Dr. Marco Gutiérrez",
    department: "Redes y Telecomunicaciones",
    avatar: "MG",
    courses: ["Redes I", "Redes II", "Seguridad Informática"],
    ratings: { clarity: 4.1, rigor: 4.3, punctuality: 3.7, treatment: 4.2 },
    reviewCount: 55,
    recommended: 82,
    tags: ["Conocimiento profundo", "A veces llega tarde", "Exámenes difíciles"],
  },
  {
    id: "p5",
    name: "MSc. Laura Quesada",
    department: "Matemáticas",
    avatar: "LQ",
    courses: ["Estadística", "Probabilidad", "Métodos Numéricos"],
    ratings: { clarity: 4.8, rigor: 3.8, punctuality: 4.7, treatment: 4.9 },
    reviewCount: 93,
    recommended: 96,
    tags: ["Excelente profesora", "Muy paciente", "Recomendada"],
  },
  {
    id: "p6",
    name: "Ing. Pablo Hernández",
    department: "Ingeniería en Sistemas",
    avatar: "PH",
    courses: ["Sistemas Operativos", "Arquitectura de Computadoras"],
    ratings: { clarity: 3.5, rigor: 4.5, punctuality: 4.1, treatment: 3.8 },
    reviewCount: 48,
    recommended: 65,
    tags: ["Contenido denso", "Buen conocimiento", "Poca interacción"],
  },
];

export const REVIEWS: Review[] = [
  {
    id: "r1",
    professorId: "p1",
    studentName: "Sofía M.",
    course: "Estructuras de Datos",
    semester: "I-2025",
    clarity: 5,
    rigor: 4,
    punctuality: 5,
    treatment: 5,
    comment: "La Dra. Solís es excepcional. Sus explicaciones son muy claras y siempre está dispuesta a resolver dudas. Los proyectos son retadores pero aprendes muchísimo.",
    wouldRecommend: true,
    date: "2025-06-15",
  },
  {
    id: "r2",
    professorId: "p1",
    studentName: "Diego R.",
    course: "Algoritmos",
    semester: "II-2024",
    clarity: 5,
    rigor: 4,
    punctuality: 5,
    treatment: 5,
    comment: "Una de las mejores profesoras que he tenido. El material está muy bien estructurado.",
    wouldRecommend: true,
    date: "2024-11-20",
  },
  {
    id: "r3",
    professorId: "p2",
    studentName: "Valeria C.",
    course: "Cálculo II",
    semester: "I-2025",
    clarity: 3,
    rigor: 5,
    punctuality: 4,
    treatment: 3,
    comment: "El curso es muy exigente. Aprendes mucho pero hay que dedicarle bastante tiempo. No es muy paciente si no entendiste la primera vez.",
    wouldRecommend: false,
    date: "2025-06-10",
  },
  {
    id: "r4",
    professorId: "p3",
    studentName: "Carlos F.",
    course: "Bases de Datos",
    semester: "I-2025",
    clarity: 5,
    rigor: 4,
    punctuality: 5,
    treatment: 5,
    comment: "Andrea es increíble, siempre está disponible para ayudar y los proyectos del curso son muy aplicados a la vida real.",
    wouldRecommend: true,
    date: "2025-06-18",
  },
  {
    id: "r5",
    professorId: "p5",
    studentName: "María José A.",
    course: "Estadística",
    semester: "I-2025",
    clarity: 5,
    rigor: 4,
    punctuality: 5,
    treatment: 5,
    comment: "La mejor profesora de matemáticas de la carrera. Explica todo desde cero, es súper paciente y sus exámenes son justos.",
    wouldRecommend: true,
    date: "2025-06-22",
  },
];

export const ALL_SECTIONS: Section[] = [
  // Programación I
  { id: "s1", courseCode: "IC-1400", courseName: "Programación I", professor: "Dra. Carmen Solís", professorId: "p1", group: "01", credits: 4, day: "Lun", startHour: 8, endHour: 10, room: "A-101", enrolled: 28, capacity: 30 },
  { id: "s2", courseCode: "IC-1400", courseName: "Programación I", professor: "Ing. Pablo Hernández", professorId: "p6", group: "02", credits: 4, day: "Mar", startHour: 10, endHour: 12, room: "B-204", enrolled: 22, capacity: 30 },
  { id: "s3", courseCode: "IC-1400", courseName: "Programación I", professor: "Dra. Carmen Solís", professorId: "p1", group: "03", credits: 4, day: "Mié", startHour: 14, endHour: 16, room: "A-101", enrolled: 15, capacity: 30 },

  // Cálculo I
  { id: "s4", courseCode: "MA-1001", courseName: "Cálculo I", professor: "MSc. Rodrigo Vargas", professorId: "p2", group: "01", credits: 4, day: "Lun", startHour: 10, endHour: 12, room: "C-305", enrolled: 35, capacity: 40 },
  { id: "s5", courseCode: "MA-1001", courseName: "Cálculo I", professor: "MSc. Laura Quesada", professorId: "p5", group: "02", credits: 4, day: "Mar", startHour: 8, endHour: 10, room: "C-301", enrolled: 40, capacity: 40 },
  { id: "s6", courseCode: "MA-1001", courseName: "Cálculo I", professor: "MSc. Laura Quesada", professorId: "p5", group: "03", credits: 4, day: "Jue", startHour: 13, endHour: 15, room: "C-301", enrolled: 30, capacity: 40 },

  // Estructuras de Datos
  { id: "s7", courseCode: "IC-2001", courseName: "Estructuras de Datos", professor: "Dra. Carmen Solís", professorId: "p1", group: "01", credits: 4, day: "Mar", startHour: 14, endHour: 16, room: "A-202", enrolled: 25, capacity: 28 },
  { id: "s8", courseCode: "IC-2001", courseName: "Estructuras de Datos", professor: "Lic. Andrea Mora", professorId: "p3", group: "02", credits: 4, day: "Jue", startHour: 10, endHour: 12, room: "B-105", enrolled: 20, capacity: 28 },

  // Bases de Datos
  { id: "s9", courseCode: "IC-3001", courseName: "Bases de Datos", professor: "Lic. Andrea Mora", professorId: "p3", group: "01", credits: 4, day: "Mié", startHour: 10, endHour: 12, room: "B-201", enrolled: 18, capacity: 25 },
  { id: "s10", courseCode: "IC-3001", courseName: "Bases de Datos", professor: "Lic. Andrea Mora", professorId: "p3", group: "02", credits: 4, day: "Vie", startHour: 8, endHour: 10, room: "B-201", enrolled: 22, capacity: 25 },

  // Estadística
  { id: "s11", courseCode: "MA-2005", courseName: "Estadística", professor: "MSc. Laura Quesada", professorId: "p5", group: "01", credits: 3, day: "Lun", startHour: 13, endHour: 14, room: "C-102", enrolled: 38, capacity: 45 },
  { id: "s11b", courseCode: "MA-2005", courseName: "Estadística", professor: "MSc. Laura Quesada", professorId: "p5", group: "01", credits: 3, day: "Mié", startHour: 13, endHour: 14, room: "C-102", enrolled: 38, capacity: 45 },
  { id: "s12", courseCode: "MA-2005", courseName: "Estadística", professor: "MSc. Rodrigo Vargas", professorId: "p2", group: "02", credits: 3, day: "Mar", startHour: 15, endHour: 17, room: "C-108", enrolled: 30, capacity: 45 },

  // Redes I
  { id: "s13", courseCode: "IC-4001", courseName: "Redes I", professor: "Dr. Marco Gutiérrez", professorId: "p4", group: "01", credits: 4, day: "Vie", startHour: 10, endHour: 12, room: "Lab-3", enrolled: 20, capacity: 24 },
  { id: "s14", courseCode: "IC-4001", courseName: "Redes I", professor: "Dr. Marco Gutiérrez", professorId: "p4", group: "02", credits: 4, day: "Sáb", startHour: 8, endHour: 10, room: "Lab-3", enrolled: 15, capacity: 24 },

  // Sistemas Operativos
  { id: "s15", courseCode: "IC-3301", courseName: "Sistemas Operativos", professor: "Ing. Pablo Hernández", professorId: "p6", group: "01", credits: 4, day: "Lun", startHour: 8, endHour: 10, room: "A-305", enrolled: 24, capacity: 30 },
  { id: "s16", courseCode: "IC-3301", courseName: "Sistemas Operativos", professor: "Ing. Pablo Hernández", professorId: "p6", group: "02", credits: 4, day: "Jue", startHour: 15, endHour: 17, room: "A-305", enrolled: 18, capacity: 30 },

  // Álgebra Lineal
  { id: "s17", courseCode: "MA-1010", courseName: "Álgebra Lineal", professor: "MSc. Rodrigo Vargas", professorId: "p2", group: "01", credits: 3, day: "Mié", startHour: 8, endHour: 10, room: "C-201", enrolled: 35, capacity: 40 },
  { id: "s18", courseCode: "MA-1010", courseName: "Álgebra Lineal", professor: "MSc. Laura Quesada", professorId: "p5", group: "02", credits: 3, day: "Vie", startHour: 13, endHour: 15, room: "C-201", enrolled: 28, capacity: 40 },
];

export const COURSE_NAMES = [...new Set(ALL_SECTIONS.map((s) => s.courseName))];
