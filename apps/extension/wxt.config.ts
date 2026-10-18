import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "MiMatrícula · Extractor de matrícula",
    short_name: "MiMatrícula",
    description:
      "Lee la oferta de cursos y secciones del portal de matrícula y la envía a MiMatrícula. No guarda contraseñas.",
    version: "0.1.0",
    permissions: ["storage", "tabs"],
    // Mantener en sincronía con los "matches" de entrypoints/*.content.ts
    host_permissions: ["http://localhost:5174/*", "http://localhost:5173/*"],
    action: { default_title: "MiMatrícula" },
  },
});
