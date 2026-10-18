import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SelectionState {
  /** courseCode -> sectionCode */
  picks: Record<string, string>;
  pick: (courseCode: string, sectionCode: string) => void;
  remove: (courseCode: string) => void;
  replaceAll: (picks: Record<string, string>) => void;
  clear: () => void;
}

/** Secciones que el estudiante eligió para su horario. */
export const useSelection = create<SelectionState>()(
  persist(
    (set) => ({
      picks: {},
      pick: (courseCode, sectionCode) => set((s) => ({ picks: { ...s.picks, [courseCode]: sectionCode } })),
      remove: (courseCode) =>
        set((s) => {
          const picks = { ...s.picks };
          delete picks[courseCode];
          return { picks };
        }),
      replaceAll: (picks) => set({ picks }),
      clear: () => set({ picks: {} }),
    }),
    { name: "mimatricula:horario" },
  ),
);
