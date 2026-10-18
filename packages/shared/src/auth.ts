/**
 * Validación de correo institucional para la demo.
 * Solo revisa el formato: no comprueba que el correo exista ni que pertenezca a quien lo escribe.
 * Una versión real debe verificarlo enviando un enlace al correo.
 */
export const UTP_DOMAIN = "utp.edu.pe";

const UTP_EMAIL = /^[a-z0-9._%+-]+@utp\.edu\.pe$/i;

export function isUtpEmail(email: string): boolean {
  return UTP_EMAIL.test(email.trim());
}

/** "u23241814@utp.edu.pe" -> "U23241814" (código de alumno), si el usuario del correo lo parece. */
export function studentCodeFromEmail(email: string): string | undefined {
  const user = email.trim().split("@")[0] ?? "";
  return /^u\d{8}$/i.test(user) ? user.toUpperCase() : undefined;
}
