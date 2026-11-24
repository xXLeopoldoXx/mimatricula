import { professorKey, type EnrollmentOffer, type Professor } from "@mimatricula/shared";
import { DEMO_OFFER } from "@mimatricula/demo-data";
import { communityId, type CommunityProfessor } from "../store/professors";

/** Docentes de demostración + comunidad, por clave de nombre normalizado. */
export function buildDirectory(community: CommunityProfessor[]): Map<string, Professor> {
  const byKey = new Map<string, Professor>();
  for (const p of DEMO_OFFER.professors) byKey.set(professorKey(p.name), p);
  for (const p of community) if (!byKey.has(professorKey(p.name))) byKey.set(professorKey(p.name), p);
  return byKey;
}

export interface Resolved {
  offer: EnrollmentOffer;
  /** Docentes de la oferta que no estaban en el directorio (se registran como comunidad). */
  unmatched: Professor[];
}

/**
 * Empareja los docentes de una oferta con el directorio por nombre normalizado
 * (sin tildes, mayúsculas, títulos ni orden de apellidos). Las secciones pasan a usar
 * el id del docente existente, así sus reseñas y su nota se ven en recomendaciones y generador.
 */
export function resolveOffer(offer: EnrollmentOffer, community: CommunityProfessor[]): Resolved {
  const directory = buildDirectory(community);
  const idMap = new Map<string, string>();
  const professors = new Map<string, Professor>();
  const unmatched: Professor[] = [];

  const resolveOne = (id: string | undefined, name: string, department: string): string => {
    const hit = directory.get(professorKey(name));
    if (hit) {
      professors.set(hit.id, hit);
      if (id) idMap.set(id, hit.id);
      return hit.id;
    }
    const cid = communityId(name);
    const created: Professor = { id: cid, name, department };
    professors.set(cid, created);
    if (id) idMap.set(id, cid);
    if (!unmatched.some((u) => u.id === cid)) unmatched.push(created);
    return cid;
  };

  for (const p of offer.professors) resolveOne(p.id, p.name, p.department);

  const sections = offer.sections.map((s) => {
    if (!s.professorId && !s.professorName) return s;
    const id = s.professorId ? idMap.get(s.professorId) : undefined;
    if (id) return { ...s, professorId: id };
    // Sección con nombre pero sin docente en la lista: se empareja igual por nombre
    if (s.professorName) return { ...s, professorId: resolveOne(s.professorId, s.professorName, "Sin área") };
    return s;
  });

  return { offer: { ...offer, professors: [...professors.values()], sections }, unmatched };
}
