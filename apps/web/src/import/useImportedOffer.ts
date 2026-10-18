import { useCallback, useEffect, useState } from "react";
import { CatalogImportSchema, type CatalogImport } from "@mimatricula/shared";

const KEY = "mimatricula:oferta";
/** Deben coincidir con apps/extension/lib/messages.ts */
const PAGE_IMPORT = "mimatricula:import";
const PAGE_ACK = "mimatricula:import:ack";

function load(): CatalogImport | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = CatalogImportSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Recibe la oferta que envía la extensión (vía window.postMessage desde su content script),
 * la valida con el contrato compartido y la guarda en el navegador.
 * En la fase 4 esto se guardará en el API en vez de localStorage.
 */
export function useImportedOffer() {
  const [imported, setImported] = useState<CatalogImport | null>(load);
  const [justImported, setJustImported] = useState(false);

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
      try {
        localStorage.setItem(KEY, JSON.stringify(parsed.data));
      } catch {
        /* sin almacenamiento: queda solo en memoria */
      }
      setImported(parsed.data);
      setJustImported(true);
      window.postMessage({ type: PAGE_ACK, ok: true }, window.location.origin);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignorar */
    }
    setImported(null);
    setJustImported(false);
  }, []);

  const dismiss = useCallback(() => setJustImported(false), []);

  return { imported, justImported, clear, dismiss };
}
