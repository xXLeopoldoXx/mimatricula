import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CycleState {
  /** Ciclo elegido ("01", "02"...), "TODOS", o null para elegir uno automáticamente. */
  selected: string | null;
  set: (c: string | null) => void;
}

/** Ciclo que se está mirando. Con una oferta grande (varios ciclos) evita mezclar cursos de ciclos distintos. */
export const useCycle = create<CycleState>()(
  persist((set) => ({ selected: null, set: (selected) => set({ selected }) }), { name: "mimatricula:ciclo" }),
);
