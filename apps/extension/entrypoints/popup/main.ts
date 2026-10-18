import type { CatalogImport } from "@mimatricula/shared";
import type { ExtMessage, Result } from "../../lib/messages";

const PORTAL_URL = "http://localhost:5174/";
const app = document.getElementById("app")!;

type State =
  | { kind: "loading" }
  | { kind: "not-portal" }
  | { kind: "ready" }
  | { kind: "extracting" }
  | { kind: "extracted"; data: CatalogImport }
  | { kind: "sending"; data: CatalogImport }
  | { kind: "sent"; data: CatalogImport }
  | { kind: "error"; message: string; data?: CatalogImport };

let state: State = { kind: "loading" };
let tabId: number | undefined;

function set(next: State) {
  state = next;
  render();
}

async function init() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  tabId = tab?.id;
  const onPortal = !!tab?.url?.startsWith(PORTAL_URL);
  set(onPortal ? { kind: "ready" } : { kind: "not-portal" });
}

async function extract() {
  if (tabId == null) return;
  set({ kind: "extracting" });
  try {
    const res = (await browser.tabs.sendMessage(tabId, { type: "MM_EXTRACT" } satisfies ExtMessage)) as Result<CatalogImport>;
    if (!res.ok) return set({ kind: "error", message: res.error });
    await browser.storage.local.set({ lastExtract: res.data });
    set({ kind: "extracted", data: res.data });
  } catch {
    set({ kind: "error", message: "No se pudo leer la página. Recarga el portal (F5) e inténtalo de nuevo." });
  }
}

async function send(data: CatalogImport) {
  set({ kind: "sending", data });
  const res = (await browser.runtime.sendMessage({ type: "MM_SEND", payload: data } satisfies ExtMessage)) as Result<null>;
  if (res?.ok) set({ kind: "sent", data });
  else set({ kind: "error", message: res?.error ?? "No se pudo enviar.", data });
}

function summary(d: CatalogImport) {
  const o = d.offer;
  const withProf = o.sections.filter((s) => s.professorName).length;
  const night = o.sections.filter((s) => s.shift === "NOCHE").length;
  return `
    <div class="card">
      <div><b>${esc(o.term)}</b> · <small>${esc(o.student.name)} (${esc(o.student.code)})</small></div>
      <div class="grid">
        <div><b>${o.courses.length}</b><span>cursos</span></div>
        <div><b>${o.sections.length}</b><span>secciones</span></div>
        <div><b>${o.professors.length}</b><span>docentes</span></div>
        <div><b>${Math.round((withProf / Math.max(1, o.sections.length)) * 100)}%</b><span>secciones con docente</span></div>
        <div><b>${o.sections.length - night}</b><span>en la mañana</span></div>
        <div><b>${night}</b><span>en la noche</span></div>
      </div>
    </div>`;
}

function render() {
  const s = state;
  switch (s.kind) {
    case "loading":
      app.innerHTML = `<p>Cargando…</p>`;
      break;
    case "not-portal":
      app.innerHTML = `
        <div class="status"><span class="dot warn"></span>No estás en el portal de matrícula</div>
        <p>Abre el portal, inicia sesión y vuelve a presionar este botón.</p>
        <button id="open">Abrir portal de matrícula</button>`;
      on("open", () => browser.tabs.create({ url: PORTAL_URL }));
      break;
    case "ready":
      app.innerHTML = `
        <div class="status"><span class="dot ok"></span>Portal de matrícula detectado</div>
        <p>Leeremos los cursos, secciones, horarios, turnos y docentes que ofrece el portal.</p>
        <button id="extract">Extraer oferta</button>`;
      on("extract", extract);
      break;
    case "extracting":
      app.innerHTML = `<p>Leyendo la oferta del portal…</p><button disabled>Extrayendo…</button>`;
      break;
    case "extracted":
      app.innerHTML = `
        <div class="status"><span class="dot ok"></span>Oferta lista para enviar</div>
        ${summary(s.data)}
        <button id="send">Enviar a MiMatrícula</button>
        <button id="again" class="secondary">Volver a extraer</button>`;
      on("send", () => send(s.data));
      on("again", extract);
      break;
    case "sending":
      app.innerHTML = `${summary(s.data)}<button disabled>Enviando a MiMatrícula…</button>`;
      break;
    case "sent":
      app.innerHTML = `
        <div class="success">Listo. MiMatrícula recibió ${s.data.offer.courses.length} cursos y ${s.data.offer.sections.length} secciones.</div>
        ${summary(s.data)}`;
      break;
    case "error":
      app.innerHTML = `
        <div class="error">${esc(s.message)}</div>
        ${s.data ? `<button id="retry">Reintentar envío</button>` : `<button id="again">Reintentar</button>`}`;
      if (s.data) on("retry", () => send(s.data!));
      else on("again", extract);
      break;
  }
}

function on(id: string, fn: () => unknown) {
  document.getElementById(id)?.addEventListener("click", () => void fn());
}

function esc(t: string) {
  return t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

init();
