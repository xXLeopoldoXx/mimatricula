import { useEffect } from "react";
import { CatalogImportSchema } from "@mimatricula/shared";
import { useOfferStore } from "../store/offer";

/** Deben coincidir con apps/extension/lib/messages.ts */
const PAGE_IMPORT = "mimatricula:import";
const PAGE_ACK = "mimatricula:import:ack";

/**
 * Recibe la oferta que envía la extensión (vía window.postMessage desde su content script),
 * la valida con el contrato compartido y la guarda.
 */
export function useExtensionBridge() {
  const setImported = useOfferStore((s) => s.setImported);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      // Solo mensajes de esta misma ventana (el content script comparte la página)
      if (e.source !== window || e.origin !== window.location.origin) return;
      if (e.data?.type !== PAGE_IMPORT) return;

      const parsed = CatalogImportSchema.safeParse(e.data.payload);
      if (!parsed.success) {
        window.postMessage({ type: PAGE_ACK, ok: false, error: "Los datos no cumplen el formato esperado." }, window.location.origin);
        return;
      }
      setImported(parsed.data, "extension");
      window.postMessage({ type: PAGE_ACK, ok: true }, window.location.origin);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [setImported]);
}
