import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StudentPreferences } from "@mimatricula/shared";

export const DEFAULT_PREFS: StudentPreferences = {
  bands: [],
  works: false,
  busy: [],
  bufferMin: 30,
  maxCourses: 6,
  budgetPen: null,
  costPerCreditPen: 50,
  professorWeight: 0.6,
  freeDays: [],
};

interface PreferencesState {
  prefs: StudentPreferences;
  set: (patch: Partial<StudentPreferences>) => void;
  reset: () => void;
}

/** Respuestas del asistente del generador, guardadas para no repetirlas cada vez. */
export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      prefs: DEFAULT_PREFS,
      set: (patch) => set((s) => ({ prefs: { ...s.prefs, ...patch } })),
      reset: () => set({ prefs: DEFAULT_PREFS }),
    }),
    { name: "mimatricula:preferencias" },
  ),
);
