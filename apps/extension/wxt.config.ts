import { defineConfig } from "wxt";

/** "https://x.vercel.app/" -> "https://x.vercel.app/*" (patrón de permisos del navegador). */
const pattern = (url: string) => `${url.replace(/\/$/, "")}/*`;

export default defineConfig({
  // Función: así WXT ya cargó apps/extension/.env y import.meta.env tiene WXT_WEB_URL y WXT_PORTAL_URL
  manifest: () => ({
    name: "MiMatrícula · Extractor de matrícula",
    short_name: "MiMatrícula",
    description:
      "Lee la oferta de cursos y secciones del portal de matrícula y la envía a MiMatrícula. No guarda contraseñas.",
    version: "0.1.0",
    permissions: ["storage", "tabs"],
    // Mismas variables que los "matches" de entrypoints/*.content.ts (ver .env.example)
    host_permissions: [
      pattern(import.meta.env.WXT_PORTAL_URL || "http://localhost:5174"),
      pattern(import.meta.env.WXT_WEB_URL || "http://localhost:5173"),
    ],
    action: { default_title: "MiMatrícula" },
  }),
});
