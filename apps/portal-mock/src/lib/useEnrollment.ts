import { useCallback, useEffect, useState } from "react";

const KEY = "portal-mock:matricula";

interface State {
  /** courseCode -> sectionCode */
  picks: Record<string, string>;
  completedAt: string | null;
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    /* almacenamiento no disponible: se empieza vacío */
  }
  return { picks: {}, completedAt: null };
}

/** Selección de secciones del estudiante, guardada en el navegador. */
export function useEnrollment() {
  const [state, setState] = useState<State>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignorar */
    }
  }, [state]);

  const pick = useCallback(
    (courseCode: string, sectionCode: string) =>
      setState((s) => ({ ...s, picks: { ...s.picks, [courseCode]: sectionCode } })),
    [],
  );
  const remove = useCallback(
    (courseCode: string) =>
      setState((s) => {
        const picks = { ...s.picks };
        delete picks[courseCode];
        return { ...s, picks };
      }),
    [],
  );
  const complete = useCallback(() => setState((s) => ({ ...s, completedAt: new Date().toISOString() })), []);
  const reset = useCallback(() => setState({ picks: {}, completedAt: null }), []);

  return { ...state, pick, remove, complete, reset };
}
