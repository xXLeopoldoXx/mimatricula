import { generate, type GenerateInput } from "@mimatricula/scheduler";

/** Corre el generador fuera del hilo principal para que la página no se congele. */
self.onmessage = (e: MessageEvent<GenerateInput>) => {
  self.postMessage(generate(e.data));
};
