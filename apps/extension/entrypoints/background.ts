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
      .then(() => finish({ ok: true, data: null }))
      .catch((e: unknown) => finish({ ok: false, error: e instanceof Error ? e.message : String(e) }));
    return true;

    // El popup suele estar cerrado cuando esto termina: el resultado queda en el ícono y en storage
    async function finish(r: Result<null>) {
      await browser.storage.local.set({ lastSend: { ...r, at: Date.now() } });
      await browser.action.setBadgeBackgroundColor({ color: r.ok ? "#059669" : "#dc2626" });
      await browser.action.setBadgeText({ text: r.ok ? "✓" : "!" });
      sendResponse(r);
    }
  });
});

async function deliver(payload: Extract<ExtMessage, { type: "MM_SEND" }>["payload"]) {
  const [existing] = await browser.tabs.query({ url: `${WEB_URL}*` });
  const tab = existing ?? (await browser.tabs.create({ url: WEB_URL, active: true }));
  if (tab.id == null) throw new Error("No se pudo abrir MiMatrícula.");
  if (existing) await browser.tabs.update(tab.id, { active: true });
  await waitForComplete(tab.id);

  // El content script puede tardar un instante en registrarse tras la carga:
  // solo se reintenta mientras no haya quién reciba el mensaje.
  let res = await trySend(tab.id, payload);
  if (!res && existing) {
    // Pestaña abierta antes de instalar/recargar la extensión: Chrome no inyecta el content script
    // en páginas ya cargadas. Recargarla lo registra y se reintenta una vez.
    await browser.tabs.reload(tab.id);
    await new Promise((r) => setTimeout(r, 600));
    await waitForComplete(tab.id);
    res = await trySend(tab.id, payload);
  }
  if (!res) {
    // "Receiving end does not exist": la página no cargó o no es MiMatrícula
    throw new Error(`No se pudo conectar con MiMatrícula. Revisa que ${WEB_URL} cargue y que hayas iniciado sesión.`);
  }
  if (!res.ok) throw new Error(res.error);
}

async function trySend(tabId: number, payload: Extract<ExtMessage, { type: "MM_SEND" }>["payload"]): Promise<Result<null> | undefined> {
  for (let i = 0; i < 10; i++) {
    try {
      return (await browser.tabs.sendMessage(tabId, { type: "MM_DELIVER", payload } satisfies ExtMessage)) as Result<null>;
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  return undefined;
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
