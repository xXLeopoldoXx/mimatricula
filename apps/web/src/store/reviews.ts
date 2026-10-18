import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Review } from "@mimatricula/shared";

interface ReviewsState {
  /** Reseñas escritas en este navegador. En la fase 4 se enviarán al API. */
  mine: Review[];
  add: (r: Review) => void;
}

export const useMyReviews = create<ReviewsState>()(
  persist((set) => ({ mine: [], add: (r) => set((s) => ({ mine: [r, ...s.mine] })) }), {
    name: "mimatricula:resenas",
  }),
);
