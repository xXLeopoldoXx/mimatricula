import { useCallback, useState } from "react";
import { isUtpEmail, studentCodeFromEmail, type Student } from "@mimatricula/shared";

const KEY = "mimatricula:estudiante";

function load(): Student | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Student) : null;
  } catch {
    return null;
  }
}

/**
 * Sesión de demo guardada en el navegador.
 * Solo valida que el correo sea @utp.edu.pe; no hay contraseña ni verificación real.
 */
export function useStudent() {
  const [student, setStudent] = useState<Student | null>(load);

  const login = useCallback((email: string, name: string): string | null => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim().replace(/\s+/g, " ");
    if (!isUtpEmail(cleanEmail)) return "Usa tu correo institucional @utp.edu.pe";
    if (cleanName.length < 2) return "Escribe tu nombre";
    const s: Student = { email: cleanEmail, name: cleanName, code: studentCodeFromEmail(cleanEmail) };
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* sin almacenamiento: la sesión dura hasta recargar */
    }
    setStudent(s);
    return null;
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignorar */
    }
    setStudent(null);
  }, []);

  return { student, login, logout };
}

export function initials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}
