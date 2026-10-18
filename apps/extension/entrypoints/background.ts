import { WEB_URL, type ExtMessage, type Result } from "../lib/messages";

/**
 * Lleva la oferta a MiMatrícula: busca una pestaña abierta de la web (o abre una),
 * espera a que cargue y le pasa los datos a su content script.
 * Va en el background porque el popup se cierra al cambiar de pestaña.
 */
export default defineBackground(() => {
  browser.runtime.onMessage.addListener((msg: ExtMessage, _sender, sendResponse) => {
    if (msg.type !== "MM_SEND") return;
    deliver(msg.payload)
      .then(() => sendResponse({ ok: true, data: null } satisfies Result<null>))
      .catch((e: unknown) =>
        sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) } satisfies Result<null>),
      );
    return true;
  });
});

async function deliver(payload: Extract<ExtMessage, { type: "MM_SEND" }>["payload"]) {
  const [existing] = await browser.tabs.query({ url: `${WEB_URL}*` });
  const tab = existing ?? (await browser.tabs.create({ url: WEB_URL, active: true }));
  if (tab.id == null) throw new Error("No se pudo abrir MiMatrícula.");
  if (existing) await browser.tabs.update(tab.id, { active: true });
  await waitForComplete(tab.id);

  // El content script puede tardar un instante en registrarse tras la carga
  for (let i = 0; i < 10; i++) {
    try {
      const res = (await browser.tabs.sendMessage(tab.id, { type: "MM_DELIVER", payload } satisfies ExtMessage)) as
        | Result<null>
        | undefined;
      if (res?.ok) return;
      if (res && !res.ok) throw new Error(res.error);
    } catch (e) {
      if (i === 9) throw e instanceof Error ? e : new Error(String(e));
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error("MiMatrícula no recibió los datos.");
}

function waitForComplete(tabId: number): Promise<void> {
  return new Promise((resolve) => {
    browser.tabs.get(tabId).then((t) => {
      if (t.status === "complete") return resolve();
      const on = (id: number, info: { status?: string }) => {
        if (id === tabId && info.status === "complete") {
          browser.tabs.onUpdated.removeListener(on);
          resolve();
        }
      };
      browser.tabs.onUpdated.addListener(on);
    });
  });
}
