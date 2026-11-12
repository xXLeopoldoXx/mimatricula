import { createHash, randomBytes } from "node:crypto";
import argon2 from "argon2";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import {
  LoginSchema,
  RegistrationSchema,
  studentCodeFromEmail,
  type Student,
} from "@mimatricula/shared";
import { DuplicateStudentError, type AuthRepository, type StudentRecord } from "./repository";

const SESSION_COOKIE = "mm_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const SESSION_MILLISECONDS = SESSION_SECONDS * 1000;
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

export interface AppOptions {
  env?: NodeJS.ProcessEnv;
  logger?: boolean;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function publicStudent(student: StudentRecord): Student {
  return {
    email: student.email,
    name: student.name,
    ...(student.code ? { code: student.code } : {}),
  };
}

export async function buildApp(repository: AuthRepository, options: AppOptions = {}): Promise<FastifyInstance> {
  const env = options.env ?? process.env;
  const origins = new Set(
    (env.WEB_ORIGINS ?? "http://localhost:5173")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
  const production = env.NODE_ENV === "production";
  const sameSite = env.COOKIE_SAME_SITE === "none" ? "none" : "lax";
  const secureCookie = production || sameSite === "none";
  const dummyHash = await argon2.hash(randomBytes(32), ARGON2_OPTIONS);

  const app = Fastify({ logger: options.logger ?? true });
  await app.register(cookie);
  await app.register(cors, {
    origin: (origin, callback) => callback(null, !origin || origins.has(origin)),
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  });
  await app.register(rateLimit, { global: false });

  function rejectOrigin(request: FastifyRequest, reply: FastifyReply): boolean {
    const origin = request.headers.origin;
    if (origin && !origins.has(origin)) {
      void reply.code(403).send({ error: "Origen no permitido" });
      return true;
    }
    return false;
  }

  function setSessionCookie(reply: FastifyReply, token: string) {
    reply.setCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: secureCookie,
      sameSite,
      path: "/",
      maxAge: SESSION_SECONDS,
    });
  }

  function clearSessionCookie(reply: FastifyReply) {
    reply.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      secure: secureCookie,
      sameSite,
      path: "/",
    });
  }

  async function createSession(studentId: string, reply: FastifyReply) {
    const token = randomBytes(32).toString("base64url");
    const now = new Date();
    await repository.deleteExpiredSessions(now);
    await repository.createSession(studentId, hashToken(token), new Date(now.getTime() + SESSION_MILLISECONDS));
    setSessionCookie(reply, token);
  }

  app.get("/api/health", async () => ({ status: "ok" }));

  app.post(
    "/api/auth/register",
    { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } },
    async (request, reply) => {
      if (rejectOrigin(request, reply)) return;
      const parsed = RegistrationSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "Revisa los datos ingresados" });
      }

      const { name, email, password } = parsed.data;
      let student: StudentRecord;
      try {
        student = await repository.createStudent({
          email,
          name,
          code: studentCodeFromEmail(email) ?? null,
          passwordHash: await argon2.hash(password, ARGON2_OPTIONS),
        });
      } catch (error) {
        if (error instanceof DuplicateStudentError) {
          return reply.code(409).send({ error: "No se pudo crear la cuenta con esos datos" });
        }
        throw error;
      }

      await createSession(student.id, reply);
      return reply.code(201).send({ student: publicStudent(student) });
    },
  );

  app.post(
    "/api/auth/login",
    { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } },
    async (request, reply) => {
      if (rejectOrigin(request, reply)) return;
      const parsed = LoginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "Revisa los datos ingresados" });
      }

      const { email, password } = parsed.data;
      const student = await repository.findStudentByEmail(email);
      const passwordMatches = await argon2.verify(student?.passwordHash ?? dummyHash, password);
      if (!student || !passwordMatches) {
        return reply.code(401).send({ error: "Correo o contraseña incorrectos" });
      }

      await createSession(student.id, reply);
      return reply.send({ student: publicStudent(student) });
    },
  );

  app.get("/api/auth/me", async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE];
    if (!token) return reply.code(401).send({ error: "No hay una sesión activa" });

    const tokenHash = hashToken(token);
    const session = await repository.findSessionByTokenHash(tokenHash);
    if (!session || session.expiresAt <= new Date()) {
      if (session) await repository.deleteSessionByTokenHash(tokenHash);
      clearSessionCookie(reply);
      return reply.code(401).send({ error: "La sesión expiró" });
    }

    return reply.send({ student: publicStudent(session.student) });
  });

  app.post("/api/auth/logout", async (request, reply) => {
    if (rejectOrigin(request, reply)) return;
    const token = request.cookies[SESSION_COOKIE];
    if (token) await repository.deleteSessionByTokenHash(hashToken(token));
    clearSessionCookie(reply);
    return reply.code(204).send();
  });

  return app;
}
