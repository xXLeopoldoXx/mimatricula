export interface StudentRecord {
  id: string;
  email: string;
  name: string;
  code: string | null;
  passwordHash: string;
}

export interface NewStudentRecord {
  email: string;
  name: string;
  code: string | null;
  passwordHash: string;
}

export interface SessionRecord {
  expiresAt: Date;
  student: StudentRecord;
}

export interface AuthRepository {
  findStudentByEmail(email: string): Promise<StudentRecord | null>;
  createStudent(student: NewStudentRecord): Promise<StudentRecord>;
  createSession(studentId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  findSessionByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
  deleteSessionByTokenHash(tokenHash: string): Promise<void>;
  deleteExpiredSessions(now: Date): Promise<void>;
}

export class DuplicateStudentError extends Error {
  constructor() {
    super("A student already exists with this email");
    this.name = "DuplicateStudentError";
  }
}

/** Reseña guardada. `studentId` es el autor: solo sirve para moderar y para el límite de una por curso; nunca sale por el API. */
export interface ReviewRecord {
  id: string;
  studentId: string;
  professorRef: string;
  courseCode: string;
  academicPeriod: string;
  clarity: number;
  rigor: number;
  punctuality: number;
  treatment: number;
  recommends: boolean;
  comment: string;
  tags: string[];
  createdAt: Date;
}

export type NewReviewRecord = Omit<ReviewRecord, "id" | "createdAt">;

export interface ReviewRepository {
  /** Las más recientes primero. */
  listReviews(limit: number): Promise<ReviewRecord[]>;
  /** Lanza DuplicateReviewError si el estudiante ya reseñó ese docente, curso y ciclo. */
  createReview(review: NewReviewRecord): Promise<ReviewRecord>;
  /** Borra solo si la reseña es del estudiante. Devuelve false si no existe o no es suya. */
  deleteReview(id: string, studentId: string): Promise<boolean>;
}

export class DuplicateReviewError extends Error {
  constructor() {
    super("The student already reviewed this professor for this course and term");
    this.name = "DuplicateReviewError";
  }
}
