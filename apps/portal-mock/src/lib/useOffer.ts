import { useEffect, useState } from "react";
import { EnrollmentOfferSchema, type EnrollmentOffer } from "@mimatricula/shared";

/**
 * Carga la oferta como lo haría el portal real: una petición a su API interna.
 * La extensión puede leer esta misma respuesta (o el HTML) para extraer los datos.
 */
export function useOffer() {
  const [offer, setOffer] = useState<EnrollmentOffer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`${import.meta.env.BASE_URL}api/oferta.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        const parsed = EnrollmentOfferSchema.parse(json);
        if (alive) setOffer(parsed);
      })
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, []);

  return { offer, error };
}
