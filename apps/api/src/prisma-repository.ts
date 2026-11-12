import { Prisma, PrismaClient } from "@prisma/client";
import { DuplicateStudentError, type AuthRepository, type NewStudentRecord } from "./repository";

export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findStudentByEmail(email: string) {
    return this.prisma.student.findUnique({ where: { email } });
  }

  async createStudent(student: NewStudentRecord) {
    try {
      return await this.prisma.student.create({ data: student });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new DuplicateStudentError();
      }
      throw error;
    }
  }

  async createSession(studentId: string, tokenHash: string, expiresAt: Date) {
    await this.prisma.authSession.create({ data: { studentId, tokenHash, expiresAt } });
  }

  findSessionByTokenHash(tokenHash: string) {
    return this.prisma.authSession.findUnique({
      where: { tokenHash },
      include: { student: true },
    });
  }

  async deleteSessionByTokenHash(tokenHash: string) {
    await this.prisma.authSession.deleteMany({ where: { tokenHash } });
  }

  async deleteExpiredSessions(now: Date) {
    await this.prisma.authSession.deleteMany({ where: { expiresAt: { lte: now } } });
  }
}
