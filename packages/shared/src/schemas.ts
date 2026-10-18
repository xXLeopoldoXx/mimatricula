import { z } from "zod";

/**
 * Contrato de datos compartido por el portal ficticio, la extensión, el API y la web.
 * Cualquier cambio aquí afecta a todas las apps: discútanlo en un PR antes de mezclarlo.
 */

export const DaySchema = z.enum(["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"]);
export type Day = z.infer<typeof DaySchema>;

/** Hora en formato 24 h "HH:MM". */
export const TimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida, usa HH:MM");

/** Una sesión semanal de una sección (una sección puede tener varias). */
export const SessionSchema = z
  .object({
    day: DaySchema,
    start: TimeSchema,
    end: TimeSchema,
    room: z.string().optional(),
  })
  .refine((s) => s.start < s.end, { message: "La sesión debe terminar después de empezar" });
export type Session = z.infer<typeof SessionSchema>;

/** Turno tal como lo agrupa el portal de matrícula (pestañas Mañana / Noche). */
export const ShiftSchema = z.enum(["MANANA", "NOCHE"]);
export type Shift = z.infer<typeof ShiftSchema>;

export const ModalitySchema = z.enum(["PRESENCIAL", "VIRTUAL", "HIBRIDO"]);
export type Modality = z.infer<typeof ModalitySchema>;

export const CourseTypeSchema = z.enum(["OBLIGATORIO", "ELECTIVO"]);
export type CourseType = z.infer<typeof CourseTypeSchema>;

export const SectionSchema = z.object({
  /** Código de sección del portal, p. ej. "45048". */
  code: z.string().min(1),
  courseCode: z.string().min(1),
  shift: ShiftSchema,
  modality: ModalitySchema,
  /** Opcional: el portal real podría no publicar el docente. */
  professorId: z.string().optional(),
  professorName: z.string().optional(),
  sessions: z.array(SessionSchema).min(1),
  capacity: z.number().int().positive(),
  enrolled: z.number().int().nonnegative(),
});
export type Section = z.infer<typeof SectionSchema>;

export const CourseSchema = z.object({
  /** Código del curso, p. ej. "1I07N". */
  code: z.string().min(1),
  name: z.string().min(1),
  weeklyHours: z.number().positive(),
  credits: z.number().positive(),
  /** Ciclo académico como texto ("00", "01", "02"...), igual que en el portal. */
  cycle: z.string(),
  type: CourseTypeSchema,
  /** true si el estudiante ya lo desaprobó antes y debe matricularlo primero. */
  repeated: z.boolean().default(false),
});
export type Course = z.infer<typeof CourseSchema>;

export const ProfessorSchema = z.object({
  id: z.string(),
  name: z.string(),
  department: z.string(),
});
export type Professor = z.infer<typeof ProfessorSchema>;

/** Escala de 1 a 5 de cada criterio de una reseña. */
const Score = z.number().int().min(1).max(5);

export const ReviewSchema = z.object({
  id: z.string(),
  professorId: z.string(),
  courseCode: z.string(),
  term: z.string(),
  clarity: Score,
  rigor: Score,
  punctuality: Score,
  treatment: Score,
  wouldRecommend: z.boolean(),
  comment: z.string().max(800),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  /** Reseñas de simulación para la demo; se pueden borrar todas con un filtro. */
  demo: z.boolean().default(false),
});
export type Review = z.infer<typeof ReviewSchema>;

/** Lo que el portal expone (y la extensión envía) para un periodo de matrícula. */
export const EnrollmentOfferSchema = z.object({
  university: z.string(),
  term: z.string(),
  student: z.object({ code: z.string(), name: z.string() }),
  courses: z.array(CourseSchema),
  sections: z.array(SectionSchema),
  professors: z.array(ProfessorSchema),
});
export type EnrollmentOffer = z.infer<typeof EnrollmentOfferSchema>;

/** Paquete que la extensión manda a MiMatrícula. */
export const CatalogImportSchema = z.object({
  source: z.literal("utp-portal-mock").or(z.literal("utp-portal")),
  extractedAt: z.string(),
  offer: EnrollmentOfferSchema,
});
export type CatalogImport = z.infer<typeof CatalogImportSchema>;

/** Bloque semanal ocupado por el estudiante (trabajo u otra actividad). */
export const BusyBlockSchema = z.object({
  day: DaySchema,
  start: TimeSchema,
  end: TimeSchema,
  label: z.string().default("Trabajo"),
});
export type BusyBlock = z.infer<typeof BusyBlockSchema>;

/** Franjas que el estudiante elige en el asistente (más finas que los turnos del portal). */
export const TimeBandSchema = z.enum(["MANANA", "TARDE", "NOCHE"]);
export type TimeBand = z.infer<typeof TimeBandSchema>;

/** Preferencias del asistente de matrícula (se llenan con botones, no con chat). */
export const StudentPreferencesSchema = z.object({
  bands: z.array(TimeBandSchema).min(1),
  works: z.boolean(),
  busy: z.array(BusyBlockSchema),
  maxCourses: z.number().int().min(1).max(10),
  /** Presupuesto en soles para créditos; null = sin límite. */
  budgetPen: z.number().positive().nullable(),
  /** 0 = solo comodidad de horario, 1 = solo calidad docente. */
  professorWeight: z.number().min(0).max(1),
  freeDays: z.array(DaySchema),
});
export type StudentPreferences = z.infer<typeof StudentPreferencesSchema>;

export const StudentSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  code: z.string().optional(),
});
export type Student = z.infer<typeof StudentSchema>;
