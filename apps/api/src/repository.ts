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
