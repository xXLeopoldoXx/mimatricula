/** Dirección del API ("" = mismo dominio; en Vercel el proxy de vercel.json reenvía /api a Render). */
export const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

/**
 * Modo demostración: sin servidor, la cuenta y las reseñas viven en este navegador.
 * Se activa en desarrollo (`pnpm dev`) o con VITE_DEMO_AUTH=true.
 */
export const DEMO_AUTH_ENABLED = import.meta.env.DEV || import.meta.env.VITE_DEMO_AUTH === "true";
