import { useEffect, useState } from "react";

export type Route = "matricula" | "horario" | "pensiones" | "secciones";
const ROUTES: Route[] = ["matricula", "horario", "pensiones", "secciones"];

function read(): Route {
  const r = window.location.hash.replace(/^#\/?/, "") as Route;
  return ROUTES.includes(r) ? r : "matricula";
}

/** Rutas por hash (#/horario) para que el portal funcione sin servidor. */
export function useHashRoute() {
  const [route, setRoute] = useState<Route>(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const go = (r: Route) => {
    window.location.hash = `/${r}`;
  };
  return { route, go };
}
