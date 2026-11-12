import {
  LoginSchema,
  RegistrationSchema,
  StudentSchema,
  type LoginInput,
  type RegistrationInput,
  type Student,
} from "@mimatricula/shared";
import { demoAuthApi } from "./demoAuth";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const DEMO_AUTH_ENABLED = import.meta.env.DEV || import.meta.env.VITE_DEMO_AUTH === "true";

interface ApiResponse {
  response: Response;
  payload: unknown;
}

async function request(path: string, method = "GET", body?: unknown): Promise<ApiResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/auth/${path}`, {
      method,
      credentials: "include",
      ...(body === undefined
        ? {}
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Inténtalo de nuevo.");
  }

  if (response.status === 204) return { response, payload: null };
  try {
    return { response, payload: await response.json() };
  } catch {
    throw new Error("El servidor devolvió una respuesta inválida.");
  }
}

function serverError(payload: unknown): string {
  if (typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string") {
    return payload.error;
  }
  return "No se pudo completar la solicitud.";
}

function parseStudent(payload: unknown): Student {
  const parsed =
    typeof payload === "object" && payload !== null && "student" in payload
      ? StudentSchema.safeParse(payload.student)
      : null;
  if (!parsed || !parsed.success) throw new Error("El servidor devolvió datos de estudiante inválidos.");
  return parsed.data;
}

export const authApi = {
  async currentStudent(): Promise<Student | null> {
    if (DEMO_AUTH_ENABLED) return demoAuthApi.currentStudent();

    const { response, payload } = await request("me");
    if (response.status === 401) return null;
    if (!response.ok) throw new Error(serverError(payload));
    return parseStudent(payload);
  },

  async login(input: LoginInput): Promise<Student> {
    const body = LoginSchema.parse(input);
    if (DEMO_AUTH_ENABLED) return demoAuthApi.login(body);

    const { response, payload } = await request("login", "POST", body);
    if (!response.ok) throw new Error(serverError(payload));
    return parseStudent(payload);
  },

  async register(input: RegistrationInput): Promise<Student> {
    const body = RegistrationSchema.parse(input);
    if (DEMO_AUTH_ENABLED) return demoAuthApi.register(body);

    const { response, payload } = await request("register", "POST", body);
    if (!response.ok) throw new Error(serverError(payload));
    return parseStudent(payload);
  },

  async logout(): Promise<void> {
    if (DEMO_AUTH_ENABLED) return demoAuthApi.logout();

    const { response, payload } = await request("logout", "POST");
    if (!response.ok) throw new Error(serverError(payload));
  },
};
