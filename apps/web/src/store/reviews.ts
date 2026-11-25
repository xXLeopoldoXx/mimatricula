import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ReviewInputSchema, type Review, type ReviewInput } from "@mimatricula/shared";
import { DEMO_AUTH_ENABLED } from "../lib/apiConfig";
import { reviewsApi } from "../lib/reviewsApi";

interface ReviewsState {
  /** Modo demostración: reseñas escritas en este navegador. */
  mine: Review[];
  /** Con servidor: reseñas de toda la comunidad, sin autor (`mine` marca las del estudiante). */
  remote: Review[];
  status: "idle" | "loading" | "ready" | "error";
  /** Carga las reseñas del servidor (no hace nada en modo demostración). */
  load: () => Promise<void>;
  /** Devuelve un mensaje de error, o null si se publicó. */
  add: (input: ReviewInput) => Promise<string | null>;
  remove: (id: string) => Promise<string | null>;
  /** Al cerrar sesión: no dejar reseñas ni marcas de "mía" de la cuenta anterior. */
  reset: () => void;
}

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

export const useReviews = create<ReviewsState>()(
  persist(
    (set, get) => ({
      mine: [],
      remote: [],
      status: "idle",

      load: async () => {
        if (DEMO_AUTH_ENABLED || get().status === "loading") return;
        set({ status: "loading" });
        try {
          set({ remote: await reviewsApi.list(), status: "ready" });
        } catch {
          set({ status: "error" });
        }
      },

      add: async (input) => {
        const parsed = ReviewInputSchema.safeParse(input);
        if (!parsed.success) return parsed.error.issues[0]?.message ?? "Revisa los datos de la reseña.";
        try {
          if (DEMO_AUTH_ENABLED) {
            const exists = get().mine.some(
              (r) => r.professorId === parsed.data.professorId && r.courseCode === parsed.data.courseCode && r.term === parsed.data.term,
            );
            if (exists) return "Ya reseñaste a este docente en este curso y ciclo. Elimina tu reseña para escribir otra.";
            const review: Review = { ...parsed.data, id: crypto.randomUUID(), createdAt: new Date().toISOString(), demo: false, mine: true };
            set((s) => ({ mine: [review, ...s.mine] }));
          } else {
            const review = await reviewsApi.create(parsed.data);
            set((s) => ({ remote: [review, ...s.remote] }));
          }
          return null;
        } catch (error) {
          return messageFrom(error);
        }
      },

      remove: async (id) => {
        try {
          if (DEMO_AUTH_ENABLED) set((s) => ({ mine: s.mine.filter((r) => r.id !== id) }));
          else {
            await reviewsApi.remove(id);
            set((s) => ({ remote: s.remote.filter((r) => r.id !== id) }));
          }
          return null;
        } catch (error) {
          return messageFrom(error);
        }
      },

      reset: () => set({ remote: [], status: "idle" }),
    }),
    { name: "mimatricula:resenas", partialize: (s) => ({ mine: s.mine }) },
  ),
);
