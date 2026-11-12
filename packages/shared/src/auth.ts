import { z } from "zod";

/**
 * Validación de correo institucional para la demo.
 * Solo revisa el formato: no comprueba que el correo exista ni que pertenezca a quien lo escribe.
 * Una versión real debe verificarlo enviando un enlace al correo.
 */
export const UTP_DOMAIN = "utp.edu.pe";

const UTP_EMAIL = /^u\d{8}@utp\.edu\.pe$/i;

export function isUtpEmail(email: string): boolean {
  return UTP_EMAIL.test(email.trim());
}

/** "u23241814@utp.edu.pe" -> "U23241814" (código de alumno), si el usuario del correo lo parece. */
export function studentCodeFromEmail(email: string): string | undefined {
  const user = email.trim().split("@")[0] ?? "";
  return /^u\d{8}$/i.test(user) ? user.toUpperCase() : undefined;
}

const InstitutionalEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "El correo es demasiado largo")
  .email("Ingresa un correo válido")
  .refine(isUtpEmail, `Usa tu código institucional: u12345678@${UTP_DOMAIN}`);

const StudentNameSchema = z
  .string()
  .transform((value) => value.normalize("NFC").trim().replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(2, "Escribe tu nombre y apellido")
      .max(80, "El nombre no puede superar 80 caracteres")
      .refine(
        (value) => /^\p{L}{2,}(?:\s+\p{L}{2,})+$/u.test(value),
        "Usa solo letras; escribe nombre y apellido con al menos 2 letras cada uno",
      ),
  );

export const PasswordSchema = z
  .string()
  .min(12, "La contraseña debe tener al menos 12 caracteres")
  .max(128, "La contraseña no puede superar 128 caracteres")
  .refine(
    (value) => /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9\s]/.test(value),
    "Incluye mayúscula, minúscula, número y símbolo",
  );

export const LoginSchema = z.object({
  email: InstitutionalEmailSchema,
  password: z.string().min(1, "Ingresa tu contraseña").max(128, "La contraseña es demasiado larga"),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegistrationSchema = z
  .object({
    name: StudentNameSchema,
    email: InstitutionalEmailSchema,
    password: PasswordSchema,
    confirmPassword: z.string().max(128, "La confirmación es demasiado larga"),
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Las contraseñas no coinciden",
      });
    }
  });
export type RegistrationInput = z.infer<typeof RegistrationSchema>;
