import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app";
import {
  DuplicateReviewError,
  DuplicateStudentError,
  type AuthRepository,
  type NewReviewRecord,
  type NewStudentRecord,
  type ReviewRecord,
  type ReviewRepository,
  type SessionRecord,
  type StudentRecord,
} from "../repository";

class MemoryAuthRepository implements AuthRepository, ReviewRepository {
  private readonly students = new Map<string, StudentRecord>();
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly reviews: ReviewRecord[] = [];
  private nextId = 0;
  /** Fecha con la que se guardan las reseñas nuevas (se puede fijar en las pruebas). */
  now = new Date();

  async listReviews(limit: number) {
    return [...this.reviews].reverse().slice(0, limit);
  }

  async createReview(review: NewReviewRecord) {
    const duplicate = this.reviews.some(
      (r) =>
        r.studentId === review.studentId &&
        r.professorRef === review.professorRef &&
        r.courseCode === review.courseCode &&
        r.academicPeriod === review.academicPeriod,
    );
    if (duplicate) throw new DuplicateReviewError();
    const record = { ...review, id: `r${++this.nextId}`, createdAt: this.now };
    this.reviews.push(record);
    return record;
  }

  async deleteReview(id: string, studentId: string) {
    const index = this.reviews.findIndex((r) => r.id === id && r.studentId === studentId);
    if (index < 0) return false;
    this.reviews.splice(index, 1);
    return true;
  }

  async findStudentByEmail(email: string) {
    return this.students.get(email) ?? null;
  }

  async createStudent(student: NewStudentRecord) {
    if (this.students.has(student.email)) throw new DuplicateStudentError();
    const record = { ...student, id: String(++this.nextId) };
    this.students.set(record.email, record);
    return record;
  }

  async createSession(studentId: string, tokenHash: string, expiresAt: Date) {
    const student = [...this.students.values()].find((candidate) => candidate.id === studentId);
    if (!student) throw new Error("Student not found");
    this.sessions.set(tokenHash, { expiresAt, student });
  }

  async findSessionByTokenHash(tokenHash: string) {
    return this.sessions.get(tokenHash) ?? null;
  }

  async deleteSessionByTokenHash(tokenHash: string) {
    this.sessions.delete(tokenHash);
  }

  async deleteExpiredSessions(now: Date) {
    for (const [hash, session] of this.sessions) {
      if (session.expiresAt <= now) this.sessions.delete(hash);
    }
  }
}

describe("API de autenticación", () => {
  const apps: FastifyInstance[] = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  async function createApp() {
    const app = await buildApp(new MemoryAuthRepository(), { logger: false, env: { NODE_ENV: "test" } });
    apps.push(app);
    return app;
  }

  const credentials = {
    name: "Ana Pérez",
    email: "u12345678@utp.edu.pe",
    password: "MatriculaSegura2026!",
    confirmPassword: "MatriculaSegura2026!",
  };

  it("rechaza datos inválidos antes de crear una cuenta", async () => {
    const app = await createApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { ...credentials, email: "ana@gmail.com", password: "123", confirmPassword: "123" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toHaveProperty("error");
  });

  it("registra, autentica y cierra una sesión con cookie HttpOnly", async () => {
    const app = await createApp();
    const registered = await app.inject({ method: "POST", url: "/api/auth/register", payload: credentials });

    expect(registered.statusCode).toBe(201);
    expect(registered.json().student).toEqual({
      email: credentials.email,
      name: credentials.name,
      code: "U12345678",
    });
    expect(String(registered.headers["set-cookie"])).toContain("HttpOnly");
    expect(registered.body).not.toContain(credentials.password);

    const cookieHeader = String(registered.headers["set-cookie"]).split(";")[0] ?? "";
    const current = await app.inject({ method: "GET", url: "/api/auth/me", headers: { cookie: cookieHeader } });
    expect(current.statusCode).toBe(200);
    expect(current.json().student.email).toBe(credentials.email);

    const login = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: credentials.email, password: credentials.password },
    });
    expect(login.statusCode).toBe(200);

    const logout = await app.inject({
      method: "POST",
      url: "/api/auth/logout",
      headers: { cookie: cookieHeader },
    });
    expect(logout.statusCode).toBe(204);

    const afterLogout = await app.inject({ method: "GET", url: "/api/auth/me", headers: { cookie: cookieHeader } });
    expect(afterLogout.statusCode).toBe(401);
  });

  it("usa una respuesta genérica para credenciales incorrectas", async () => {
    const app = await createApp();
    await app.inject({ method: "POST", url: "/api/auth/register", payload: credentials });
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: credentials.email, password: "OtraClaveSegura2026!" },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toBe("Correo o contraseña incorrectos");
  });
});

describe("API de reseñas", () => {
  const apps: FastifyInstance[] = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  async function setup() {
    const repository = new MemoryAuthRepository();
    const app = await buildApp(repository, { logger: false, env: { NODE_ENV: "test" } });
    apps.push(app);

    async function signUp(code: string) {
      const password = "MatriculaSegura2026!";
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: { name: "Ana Pérez", email: `${code}@utp.edu.pe`, password, confirmPassword: password },
      });
      return { cookie: String(res.headers["set-cookie"]).split(";")[0] ?? "" };
    }

    return { app, repository, signUp };
  }

  const review = {
    professorId: "doc-01",
    courseCode: "1N07C",
    term: "2026-2",
    clarity: 4,
    rigor: 3,
    punctuality: 5,
    treatment: 4,
    wouldRecommend: true,
    comment: "Explica con ejemplos y responde dudas rápido.",
    tags: ["Explica bien"],
  };

  it("exige sesión para leer y publicar reseñas", async () => {
    const { app } = await setup();
    expect((await app.inject({ method: "GET", url: "/api/reviews" })).statusCode).toBe(401);
    expect((await app.inject({ method: "POST", url: "/api/reviews", payload: review })).statusCode).toBe(401);
    expect((await app.inject({ method: "DELETE", url: "/api/reviews/r1" })).statusCode).toBe(401);
  });

  it("publica una reseña y otro estudiante la ve sin autor", async () => {
    const { app, signUp } = await setup();
    const ana = await signUp("u11111111");
    const beto = await signUp("u22222222");

    const created = await app.inject({ method: "POST", url: "/api/reviews", headers: { cookie: ana.cookie }, payload: review });
    expect(created.statusCode).toBe(201);
    expect(created.json().review).toMatchObject({ professorId: "doc-01", courseCode: "1N07C", mine: true, demo: false });

    const seenByBeto = await app.inject({ method: "GET", url: "/api/reviews", headers: { cookie: beto.cookie } });
    expect(seenByBeto.statusCode).toBe(200);
    const [seen] = seenByBeto.json().reviews;
    expect(seen).toMatchObject({ comment: review.comment, mine: false });
    // Nada que identifique al autor: ni id de estudiante, ni correo, ni nombre
    expect(seenByBeto.body).not.toMatch(/studentId|u11111111|Ana/);
    expect(Object.keys(seen)).not.toContain("studentId");
    expect(seenByBeto.headers["cache-control"]).toBe("no-store");

    const seenByAna = await app.inject({ method: "GET", url: "/api/reviews", headers: { cookie: ana.cookie } });
    expect(seenByAna.json().reviews[0].mine).toBe(true);
  });

  it("redondea la fecha al mes", async () => {
    const { app, repository, signUp } = await setup();
    repository.now = new Date("2026-11-24T20:43:08.000Z");
    const ana = await signUp("u11111111");
    const created = await app.inject({ method: "POST", url: "/api/reviews", headers: { cookie: ana.cookie }, payload: review });
    expect(created.json().review.createdAt).toBe("2026-11-01T00:00:00.000Z");
  });

  it("valida el contenido de la reseña", async () => {
    const { app, signUp } = await setup();
    const ana = await signUp("u11111111");
    const post = (payload: object) => app.inject({ method: "POST", url: "/api/reviews", headers: { cookie: ana.cookie }, payload });

    expect((await post({ ...review, clarity: 6 })).statusCode).toBe(400);
    expect((await post({ ...review, comment: "corto" })).statusCode).toBe(400);
    expect((await post({ ...review, tags: ["a", "b", "c", "d"] })).statusCode).toBe(400);
    expect((await post({ ...review, term: "ayer" })).statusCode).toBe(400);
    expect((await post({ ...review, professorId: "<script>" })).statusCode).toBe(400);
    expect((await post({ ...review, studentId: "otro" })).statusCode).toBe(201); // campo extra ignorado, no se puede suplantar
  });

  it("permite una reseña por docente, curso y ciclo", async () => {
    const { app, signUp } = await setup();
    const ana = await signUp("u11111111");
    const beto = await signUp("u22222222");
    const post = (cookie: string, payload: object = review) => app.inject({ method: "POST", url: "/api/reviews", headers: { cookie }, payload });

    expect((await post(ana.cookie)).statusCode).toBe(201);
    expect((await post(ana.cookie)).statusCode).toBe(409);
    expect((await post(ana.cookie, { ...review, courseCode: "1X101" })).statusCode).toBe(201);
    expect((await post(beto.cookie)).statusCode).toBe(201);
  });

  it("solo permite borrar reseñas propias", async () => {
    const { app, signUp } = await setup();
    const ana = await signUp("u11111111");
    const beto = await signUp("u22222222");
    const created = await app.inject({ method: "POST", url: "/api/reviews", headers: { cookie: ana.cookie }, payload: review });
    const id = created.json().review.id as string;

    const byBeto = await app.inject({ method: "DELETE", url: `/api/reviews/${id}`, headers: { cookie: beto.cookie } });
    expect(byBeto.statusCode).toBe(404);

    const byAna = await app.inject({ method: "DELETE", url: `/api/reviews/${id}`, headers: { cookie: ana.cookie } });
    expect(byAna.statusCode).toBe(204);
    const list = await app.inject({ method: "GET", url: "/api/reviews", headers: { cookie: ana.cookie } });
    expect(list.json().reviews).toHaveLength(0);

    // Tras borrarla puede escribir otra
    const again = await app.inject({ method: "POST", url: "/api/reviews", headers: { cookie: ana.cookie }, payload: review });
    expect(again.statusCode).toBe(201);
  });

  it("rechaza publicar desde un origen no permitido", async () => {
    const { app, signUp } = await setup();
    const ana = await signUp("u11111111");
    const res = await app.inject({
      method: "POST",
      url: "/api/reviews",
      headers: { cookie: ana.cookie, origin: "https://malicioso.example" },
      payload: review,
    });
    expect(res.statusCode).toBe(403);
  });
});
