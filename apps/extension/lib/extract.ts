import { CatalogImportSchema, EnrollmentOfferSchema, type CatalogImport } from "@mimatricula/shared";

/**
 * Extrae la oferta del portal ficticio.
 *
 * Usa la misma petición que hace el portal (/api/oferta.json), con la sesión del propio
 * estudiante, y la cruza con lo que se ve en pantalla. Para el portal real habrá que escribir
 * otro adaptador con su URL y formato, pero la salida debe ser siempre un `CatalogImport`.
 */
export async function extractFromPortalMock(doc: Document = document): Promise<CatalogImport> {
  if (!doc.querySelector('meta[name="mimatricula:portal"][content="utp-portal-mock"]')) {
    throw new Error("Esta página no es el portal de matrícula compatible.");
  }

  const res = await fetch(new URL("api/oferta.json", doc.baseURI), { credentials: "include" });
  if (!res.ok) throw new Error(`El portal respondió ${res.status} al pedir la oferta.`);
  const offer = EnrollmentOfferSchema.parse(await res.json());

  // Los cursos visibles en la tabla deben coincidir con los de la oferta
  const rows = [...doc.querySelectorAll<HTMLElement>('[data-mm="course"]')];
  if (rows.length) {
    const visible = new Set(rows.map((r) => r.dataset.courseCode));
    const missing = offer.courses.filter((c) => !visible.has(c.code));
    if (missing.length) {
      throw new Error(`La tabla no muestra ${missing.length} curso(s) de la oferta; recarga el portal.`);
    }
  }

  return CatalogImportSchema.parse({
    source: "utp-portal-mock",
    extractedAt: new Date().toISOString(),
    offer,
  });
}
