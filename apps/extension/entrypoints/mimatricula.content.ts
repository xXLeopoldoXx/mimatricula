import { PAGE_ACK, PAGE_IMPORT, type ExtMessage, type Result } from "../lib/messages";

/**
 * Corre dentro de MiMatrícula. Pasa la oferta a la página con window.postMessage
 * y espera la confirmación (la app puede tardar un poco en montar su listener).
 */
export default defineContentScript({
  matches: ["http://localhost:5173/*"],
  main() {
    browser.runtime.onMessage.addListener((msg: ExtMessage, _sender, sendResponse) => {
      if (msg.type !== "MM_DELIVER") return;

      let done = false;
      let tries = 0;
      const finish = (r: Result<null>) => {
        if (done) return;
        done = true;
        clearInterval(timer);
        window.removeEventListener("message", onAck);
        sendResponse(r);
      };
      const onAck = (e: MessageEvent) => {
        if (e.source !== window || e.data?.type !== PAGE_ACK) return;
        finish(e.data.ok ? { ok: true, data: null } : { ok: false, error: e.data.error ?? "La web rechazó los datos." });
      };
      window.addEventListener("message", onAck);

      const post = () => {
        if (++tries > 12) return finish({ ok: false, error: "MiMatrícula abrió pero no recibió los datos. Asegúrate de usar la versión más reciente de la web (fase 2 o posterior)." });
        window.postMessage({ type: PAGE_IMPORT, payload: msg.payload }, window.location.origin);
      };
      post();
      const timer = setInterval(post, 500);
      return true;
    });
  },
});
