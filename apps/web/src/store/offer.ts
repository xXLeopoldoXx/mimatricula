import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CatalogImport } from "@mimatricula/shared";

type Source = "extension" | "demo";

interface OfferState {
  imported: CatalogImport | null;
  source: Source | null;
  /** true justo después de recibir datos de la extensión (para el aviso verde). */
  justImported: boolean;
  setImported: (data: CatalogImport, source: Source) => void;
  dismiss: () => void;
  clear: () => void;
}

/** Oferta de matrícula activa. En la fase 4 vendrá del API; por ahora vive en el navegador. */
export const useOfferStore = create<OfferState>()(
  persist(
    (set) => ({
      imported: null,
      source: null,
      justImported: false,
      setImported: (data, source) => set({ imported: data, source, justImported: source === "extension" }),
      dismiss: () => set({ justImported: false }),
      clear: () => set({ imported: null, source: null, justImported: false }),
    }),
    {
      name: "mimatricula:oferta",
      partialize: (s) => ({ imported: s.imported, source: s.source }),
    },
  ),
);
