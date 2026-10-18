import { extractFromPortalMock } from "../lib/extract";
import type { ExtMessage, Result } from "../lib/messages";
import type { CatalogImport } from "@mimatricula/shared";

/** Corre dentro del portal de matrícula. Solo lee: nunca hace clic ni envía formularios. */
export default defineContentScript({
  matches: ["http://localhost:5174/*"],
  main() {
    browser.runtime.onMessage.addListener((msg: ExtMessage, _sender, sendResponse) => {
      if (msg.type !== "MM_EXTRACT") return;
      extractFromPortalMock()
        .then((data) => sendResponse({ ok: true, data } satisfies Result<CatalogImport>))
        .catch((e: unknown) =>
          sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) } satisfies Result<CatalogImport>),
        );
      return true; // respuesta asíncrona
    });
  },
});
