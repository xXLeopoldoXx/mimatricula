import { describe, expect, it } from "vitest";
import {
  bandOf,
  isUtpEmail,
  SectionSchema,
  sessionsClash,
  shiftOf,
  studentCodeFromEmail,
  to12h,
} from "../index";

describe("tiempo", () => {
  it("formatea como el portal", () => {
    expect(to12h("13:45")).toBe("01:45 p.m");
    expect(to12h("08:30")).toBe("08:30 a.m");
    expect(to12h("12:00")).toBe("12:00 p.m");
  });

  it("clasifica turnos y franjas", () => {
    expect(shiftOf("13:45")).toBe("MANANA");
    expect(shiftOf("19:00")).toBe("NOCHE");
    expect(bandOf("10:15")).toBe("MANANA");
    expect(bandOf("15:30")).toBe("TARDE");
    expect(bandOf("20:45")).toBe("NOCHE");
  });

  it("detecta cruces con minutos", () => {
    const a = [{ day: "LUN" as const, start: "13:45", end: "15:15" }];
    expect(sessionsClash(a, [{ day: "LUN", start: "15:15", end: "16:45" }])).toBe(false);
    expect(sessionsClash(a, [{ day: "LUN", start: "15:00", end: "16:30" }])).toBe(true);
    expect(sessionsClash(a, [{ day: "MAR", start: "13:45", end: "15:15" }])).toBe(false);
  });
});

describe("correo UTP", () => {
  it("solo acepta @utp.edu.pe", () => {
    expect(isUtpEmail("u23241814@utp.edu.pe")).toBe(true);
    expect(isUtpEmail("  U23241814@UTP.EDU.PE ")).toBe(true);
    expect(isUtpEmail("alguien@gmail.com")).toBe(false);
    expect(isUtpEmail("x@utp.edu.pe.com")).toBe(false);
  });

  it("extrae el código de alumno", () => {
    expect(studentCodeFromEmail("u23241814@utp.edu.pe")).toBe("U23241814");
    expect(studentCodeFromEmail("jperez@utp.edu.pe")).toBeUndefined();
  });
});

describe("esquema de sección", () => {
  it("acepta sección sin docente y rechaza sesiones invertidas", () => {
    const base = {
      code: "45048",
      courseCode: "1I07N",
      shift: "MANANA",
      modality: "PRESENCIAL",
      capacity: 40,
      enrolled: 10,
    };
    expect(SectionSchema.safeParse({ ...base, sessions: [{ day: "VIE", start: "13:45", end: "15:15" }] }).success).toBe(true);
    expect(SectionSchema.safeParse({ ...base, sessions: [{ day: "VIE", start: "15:15", end: "13:45" }] }).success).toBe(false);
  });
});
