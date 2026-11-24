import { create } from "zustand";
import { persist } from "zustand/middleware";
import { professorKey, type Professor } from "@mimatricula/shared";

/** Docente agregado por la comunidad (a mano o al importar una oferta). */
export interface CommunityProfessor extends Professor {
  /** Cursos que dicta, por código (opcional). */
  courseCodes: string[];
  createdAt: string;
  source: "manual" | "oferta";
}

/** Id estable a partir del nombre normalizado: el mismo docente siempre cae en el mismo id. */
export function communityId(name: string): string {
  return "com-" + professorKey(name).replace(/\s+/g, "-");
}

interface State {
  list: CommunityProfessor[];
  /** Agrega los que no existan (por nombre normalizado). Devuelve cuántos se agregaron. */
  addMany: (items: CommunityProfessor[]) => number;
}

/**
 * Docentes de la comunidad, además de los de demostración. Por ahora viven en el navegador;
 * cuando el API publique /profesores, este store pasará a sincronizarse con el servidor.
 */
export const useCommunityProfessors = create<State>()(
  persist(
    (set, get) => ({
      list: [],
      addMany: (items) => {
        const known = new Set(get().list.map((p) => professorKey(p.name)));
        const fresh: CommunityProfessor[] = [];
        for (const p of items) {
          const key = professorKey(p.name);
          if (known.has(key)) continue;
          known.add(key);
          fresh.push(p);
        }
        if (fresh.length) set((s) => ({ list: [...s.list, ...fresh] }));
        return fresh.length;
      },
    }),
    { name: "mimatricula:docentes" },
  ),
);
