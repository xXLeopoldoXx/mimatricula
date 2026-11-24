/**
 * Direcciones de MiMatrícula y del portal. Por defecto apuntan a tu computadora.
 * Para la nube, defínelas en apps/extension/.env (ver .env.example) y vuelve a compilar.
 */
const slash = (url: string) => (url.endsWith("/") ? url : `${url}/`);

export const WEB_URL = slash(import.meta.env.WXT_WEB_URL || "http://localhost:5173/");
export const PORTAL_URL = slash(import.meta.env.WXT_PORTAL_URL || "http://localhost:5174/");
