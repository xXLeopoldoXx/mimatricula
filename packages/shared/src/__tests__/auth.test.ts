import { describe, expect, it } from "vitest";
import { LoginSchema, RegistrationSchema } from "../auth";

describe("autenticación", () => {
  const validRegistration = {
    name: "  Ana   María Pérez ",
    email: "  U12345678@UTP.EDU.PE ",
    password: "MatriculaSegura2026!",
    confirmPassword: "MatriculaSegura2026!",
  };

  it("normaliza el correo y el nombre del registro", () => {
    expect(RegistrationSchema.parse(validRegistration)).toMatchObject({
      name: "Ana María Pérez",
      email: "u12345678@utp.edu.pe",
    });
  });

  it("rechaza correos externos, contraseñas débiles y confirmaciones distintas", () => {
    expect(RegistrationSchema.safeParse({ ...validRegistration, email: "ana@gmail.com" }).success).toBe(false);
    expect(RegistrationSchema.safeParse({ ...validRegistration, email: "u1234567@utp.edu.pe" }).success).toBe(false);
    expect(RegistrationSchema.safeParse({ ...validRegistration, email: "x12345678@utp.edu.pe" }).success).toBe(false);
    expect(RegistrationSchema.safeParse({ ...validRegistration, password: "weak", confirmPassword: "weak" }).success).toBe(false);
    expect(
      RegistrationSchema.safeParse({ ...validRegistration, confirmPassword: "OtraClaveSegura2026!" }).success,
    ).toBe(false);
  });

  it("exige un nombre y apellido compuestos solo por letras", () => {
    expect(RegistrationSchema.safeParse({ ...validRegistration, name: "A Pérez" }).success).toBe(false);
    expect(RegistrationSchema.safeParse({ ...validRegistration, name: "Ana P3rez" }).success).toBe(false);
    expect(RegistrationSchema.safeParse({ ...validRegistration, name: "Ana Pérez" }).success).toBe(true);
  });

  it("permite iniciar sesión solo con correo institucional y contraseña", () => {
    expect(LoginSchema.safeParse({ email: "u12345678@utp.edu.pe", password: "password" }).success).toBe(true);
    expect(LoginSchema.safeParse({ email: "u12345678@gmail.com", password: "password" }).success).toBe(false);
  });
});
