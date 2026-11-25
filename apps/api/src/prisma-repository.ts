import { Prisma, PrismaClient } from "@prisma/client";
import {
  DuplicateReviewError,
  DuplicateStudentError,
  type AuthRepository,
  type NewReviewRecord,
  type NewStudentRecord,
  type ReviewRepository,
} from "./repository";

export class PrismaAuthRepository implements AuthRepository, ReviewRepository {
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

  listReviews(limit: number) {
    return this.prisma.communityReview.findMany({ orderBy: { createdAt: "desc" }, take: limit });
  }

  async createReview(review: NewReviewRecord) {
    try {
      return await this.prisma.communityReview.create({ data: review });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new DuplicateReviewError();
      }
      throw error;
    }
  }

  async deleteReview(id: string, studentId: string) {
    const { count } = await this.prisma.communityReview.deleteMany({ where: { id, studentId } });
    return count > 0;
  }
}
