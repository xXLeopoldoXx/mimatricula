import {
  LoginSchema,
  RegistrationSchema,
  StudentSchema,
  studentCodeFromEmail,
  type Student,
} from "@mimatricula/shared";

const STORAGE_KEY = "mimatricula.demo-auth.v1";
const PASSWORD_HASH_ITERATIONS = 120_000;

interface DemoAccount extends Student {
  passwordSalt: string;
  passwordHash: string;
}

interface DemoState {
  accounts: DemoAccount[];
  sessionEmail: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseState(stateValue: unknown): DemoState {
  if (!isRecord(stateValue) || !Array.isArray(stateValue.accounts)) {
    throw new Error("Los datos de la demo no son válidos. Borra los datos locales de este sitio para reiniciarla.");
  }

  const accounts: DemoAccount[] = [];
  for (const accountValue of stateValue.accounts) {
    if (!isRecord(accountValue)) {
      throw new Error("Los datos de la demo no son válidos. Borra los datos locales de este sitio para reiniciarla.");
    }

    const student = StudentSchema.safeParse({
      email: accountValue.email,
      name: accountValue.name,
      code: accountValue.code,
    });
    if (
      !student.success ||
      typeof accountValue.passwordSalt !== "string" ||
      !/^[0-9a-f]{32}$/.test(accountValue.passwordSalt) ||
      typeof accountValue.passwordHash !== "string" ||
      !/^[0-9a-f]{64}$/.test(accountValue.passwordHash)
    ) {
      throw new Error("Los datos de la demo no son válidos. Borra los datos locales de este sitio para reiniciarla.");
    }
    accounts.push({
      ...student.data,
      passwordSalt: accountValue.passwordSalt,
      passwordHash: accountValue.passwordHash,
    });
  }

  const emails = new Set<string>();
  for (const account of accounts) {
    if (emails.has(account.email)) {
      throw new Error("Los datos de la demo contienen cuentas duplicadas. Borra los datos locales de este sitio.");
    }
    emails.add(account.email);
  }

  if (stateValue.sessionEmail !== null && typeof stateValue.sessionEmail !== "string") {
    throw new Error("Los datos de la demo no contienen una sesión válida. Borra los datos locales de este sitio.");
  }
  const sessionEmail = stateValue.sessionEmail;
  if (sessionEmail && !emails.has(sessionEmail)) {
    throw new Error("Los datos de la demo no contienen una sesión válida. Borra los datos locales de este sitio.");
  }

  return { accounts, sessionEmail };
}

function readState(): DemoState {
  const serialized = localStorage.getItem(STORAGE_KEY);
  if (!serialized) return { accounts: [], sessionEmail: null };

  let value: unknown;
  try {
    value = JSON.parse(serialized);
  } catch {
    throw new Error("Los datos de la demo están dañados. Borra los datos locales de este sitio para reiniciarla.");
  }

  return parseState(value);
}

function writeState(state: DemoState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    throw new Error("No se pudieron guardar los datos demo en este navegador.");
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const saltBuffer = new ArrayBuffer(salt.byteLength);
  new Uint8Array(saltBuffer).set(salt);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBuffer, iterations: PASSWORD_HASH_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
}

function hashesMatch(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function toStudent(account: DemoAccount): Student {
  return StudentSchema.parse({
    email: account.email,
    name: account.name,
    code: account.code,
  });
}

export const demoAuthApi = {
  async currentStudent(): Promise<Student | null> {
    const state = readState();
    if (!state.sessionEmail) return null;

    const account = state.accounts.find(({ email }) => email === state.sessionEmail);
    if (!account) throw new Error("No se encontró la cuenta de la sesión demo.");
    return toStudent(account);
  },

  async login(value: unknown): Promise<Student> {
    const input = LoginSchema.parse(value);
    const state = readState();
    const account = state.accounts.find(({ email }) => email === input.email);
    if (!account) throw new Error("Correo o contraseña incorrectos.");

    const hash = await hashPassword(input.password, hexToBytes(account.passwordSalt));
    if (!hashesMatch(hash, account.passwordHash)) {
      throw new Error("Correo o contraseña incorrectos.");
    }

    state.sessionEmail = account.email;
    writeState(state);
    return toStudent(account);
  },

  async register(value: unknown): Promise<Student> {
    const input = RegistrationSchema.parse(value);
    const state = readState();
    if (state.accounts.some(({ email }) => email === input.email)) {
      throw new Error("Ya existe una cuenta demo con ese correo. Inicia sesión.");
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const account: DemoAccount = {
      email: input.email,
      name: input.name,
      code: studentCodeFromEmail(input.email),
      passwordSalt: bytesToHex(salt),
      passwordHash: await hashPassword(input.password, salt),
    };

    state.accounts.push(account);
    state.sessionEmail = account.email;
    writeState(state);
    return toStudent(account);
  },

  async logout(): Promise<void> {
    const state = readState();
    state.sessionEmail = null;
    writeState(state);
  },
};
