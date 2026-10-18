import type { CatalogImport } from "@mimatricula/shared";

/** Mensajes entre popup, background y content scripts. */
export type ExtMessage =
  | { type: "MM_EXTRACT" }
  | { type: "MM_SEND"; payload: CatalogImport }
  | { type: "MM_DELIVER"; payload: CatalogImport };

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/** Mensajes entre el content script y la página de MiMatrícula (window.postMessage). */
export const PAGE_IMPORT = "mimatricula:import";
export const PAGE_ACK = "mimatricula:import:ack";

export const WEB_URL = "http://localhost:5173/";
