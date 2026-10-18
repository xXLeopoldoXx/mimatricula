import type { EnrollmentOffer, Review } from "@mimatricula/shared";
import offerJson from "../data/oferta.json";
import reviewsJson from "../data/resenas.json";

/** Oferta de matrícula ficticia (cursos, secciones, docentes). Generada con `pnpm gen:data`. */
export const DEMO_OFFER = offerJson as EnrollmentOffer;

/** Reseñas de simulación, todas con `demo: true`. */
export const DEMO_REVIEWS = reviewsJson as Review[];
