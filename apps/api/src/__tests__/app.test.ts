import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app";
import {
  DuplicateStudentError,
  type AuthRepository,
  type NewStudentRecord,
  type SessionRecord,
  type StudentRecord,
} from "../repository";

class MemoryAuthRepository implements AuthRepository {
  private readonly students = new Map<string, StudentRecord>();
  private readonly sessions = new Map<string, SessionRecord>();
  private nextId = 0;

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
