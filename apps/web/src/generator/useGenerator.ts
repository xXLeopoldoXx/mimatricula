import { useCallback, useEffect, useRef, useState } from "react";
import type { GenerateInput, GenerateResult } from "@mimatricula/scheduler";

/** Lanza el generador en un Web Worker y expone el último resultado. */
export function useGenerator() {
  const worker = useRef<Worker | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => () => worker.current?.terminate(), []);

  const run = useCallback((input: GenerateInput) => {
    worker.current?.terminate();
    const w = new Worker(new URL("./generate.worker.ts", import.meta.url), { type: "module" });
    worker.current = w;
    setRunning(true);
    w.onmessage = (e: MessageEvent<GenerateResult>) => {
      setResult(e.data);
      setRunning(false);
      w.terminate();
    };
    w.onerror = () => setRunning(false);
    w.postMessage(input);
  }, []);

  return { result, running, run, clear: () => setResult(null) };
}
