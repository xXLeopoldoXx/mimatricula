import { ReviewSchema, type Review, type ReviewInput } from "@mimatricula/shared";
import { API_BASE } from "./apiConfig";

function field(payload: unknown, key: string): unknown {
  return typeof payload === "object" && payload !== null && key in payload ? (payload as Record<string, unknown>)[key] : undefined;
}

async function call(path: string, method: "GET" | "POST" | "DELETE", body?: unknown): Promise<{ status: number; payload: unknown }> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/reviews${path}`, {
      method,
      credentials: "include",
      ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Inténtalo de nuevo.");
  }

  let payload: unknown = null;
  if (response.status !== 204) {
    try {
      payload = await response.json();
    } catch {
      throw new Error("El servidor devolvió una respuesta inválida.");
    }
  }

  if (!response.ok) {
    if (response.status === 401) throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
    const message = typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string" ? payload.error : null;
    throw new Error(message ?? "No se pudo completar la solicitud.");
  }
  return { status: response.status, payload };
}

/** Reseñas de la comunidad guardadas en el servidor (sin autor; `mine` marca las propias). */
export const reviewsApi = {
  async list(): Promise<Review[]> {
    const { payload } = await call("", "GET");
    const parsed = ReviewSchema.array().safeParse(field(payload, "reviews"));
    if (!parsed.success) throw new Error("El servidor devolvió reseñas inválidas.");
    return parsed.data;
  },

  async create(input: ReviewInput): Promise<Review> {
    const { payload } = await call("", "POST", input);
    const parsed = ReviewSchema.safeParse(field(payload, "review"));
    if (!parsed.success) throw new Error("El servidor devolvió una reseña inválida.");
    return parsed.data;
  },

  async remove(id: string): Promise<void> {
    await call(`/${encodeURIComponent(id)}`, "DELETE");
  },
};
