import { useCallback, useEffect, useState } from "react";
import type { LoginInput, RegistrationInput, Student } from "@mimatricula/shared";
import { authApi } from "../lib/authApi";

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

export function useStudent() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    authApi
      .currentStudent()
      .then((current) => {
        if (active) setStudent(current);
      })
      .catch((error: unknown) => {
        if (active) setSessionError(messageFrom(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (input: LoginInput): Promise<string | null> => {
    try {
      setAuthError(null);
      setStudent(await authApi.login(input));
      setSessionError(null);
      return null;
    } catch (error) {
      return messageFrom(error);
    }
  }, []);

  const register = useCallback(async (input: RegistrationInput): Promise<string | null> => {
    try {
      setAuthError(null);
      setStudent(await authApi.register(input));
      setSessionError(null);
      return null;
    } catch (error) {
      return messageFrom(error);
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthError(null);
    try {
      await authApi.logout();
      setStudent(null);
    } catch (error) {
      setAuthError(messageFrom(error));
    }
  }, []);

  return { student, loading, sessionError, authError, login, register, logout };
}

export function initials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}
