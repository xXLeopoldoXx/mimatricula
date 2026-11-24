/**
 * Normalización de nombres para emparejar docentes y cursos aunque vengan escritos distinto
 * (tildes, mayúsculas, títulos como "Mg." o "Ing.", orden de apellidos, números romanos).
 */

/** Minúsculas, sin tildes ni signos, con espacios simples. */
export function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const TITLES = new Set([
  "mg", "mag", "mgtr", "msc", "ing", "lic", "dr", "dra", "arq", "prof", "profa", "econ", "abog",
  "psic", "mba", "phd", "bach", "sr", "sra", "srta", "docente",
]);

/**
 * Clave de un docente: sin títulos, sin tildes y con las palabras ordenadas, así
 * "Mg. Rosa Quispe Huamán" y "QUISPE HUAMAN, ROSA" dan la misma clave.
 */
export function professorKey(name: string): string {
  return normalizeText(name)
    .split(" ")
    .filter((t) => t && !TITLES.has(t))
    .sort()
    .join(" ");
}

const ROMAN: Record<string, string> = { i: "1", ii: "2", iii: "3", iv: "4", v: "5" };
const STOPWORDS = new Set(["de", "del", "la", "las", "el", "los", "y", "e", "a", "para", "en"]);

/** Clave de un curso: "Matemática II" y "MATEMATICA 2" coinciden. */
export function courseKey(name: string): string {
  return normalizeText(name)
    .split(" ")
    .filter((t) => t && !STOPWORDS.has(t))
    .map((t) => ROMAN[t] ?? t)
    .join(" ");
}
