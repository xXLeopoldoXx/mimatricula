import { useState, type FormEvent } from "react";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import {
  LoginSchema,
  RegistrationSchema,
  UTP_DOMAIN,
  type CatalogImport,
  type LoginInput,
  type RegistrationInput,
} from "@mimatricula/shared";
import { LogoMark, Wordmark } from "../components/Logo";
import { NIGHT_COLORS } from "../components/MiniWeek";

interface Props {
  onLogin: (input: LoginInput) => Promise<string | null>;
  onRegister: (input: RegistrationInput) => Promise<string | null>;
  /** Oferta recibida de la extensión antes de iniciar sesión. */
  imported?: CatalogImport | null;
  initialError?: string | null;
}

/** Bloques decorativos del mosaico: columna (día), fila de inicio, alto, nombre. */
const MOSAIC: { col: number; row: number; h: number; name: string }[] = [
  { col: 0, row: 0, h: 3, name: "Cálculo" },
  { col: 0, row: 4, h: 2, name: "Programación" },
  { col: 1, row: 1, h: 2, name: "Física" },
  { col: 1, row: 4, h: 3, name: "Estadística" },
  { col: 2, row: 0, h: 2, name: "Comunicación" },
  { col: 2, row: 3, h: 3, name: "Base de datos" },
  { col: 3, row: 1, h: 3, name: "Álgebra" },
  { col: 3, row: 5, h: 2, name: "Ética" },
  { col: 4, row: 0, h: 2, name: "Inglés" },
  { col: 4, row: 3, h: 2, name: "Redes" },
];

export default function LoginPage({ onLogin, onRegister, imported, initialError }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (mode === "register") {
        const parsed = RegistrationSchema.safeParse({ name, email, password, confirmPassword });
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? "Revisa los datos ingresados");
          return;
        }
        setError(await onRegister(parsed.data));
      } else {
        const parsed = LoginSchema.safeParse({ email, password });
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? "Revisa los datos ingresados");
          return;
        }
        setError(await onLogin(parsed.data));
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Panel de marca: el mosaico semanal es lo memorable de la app */}
      <section className="bg-utp-night blob hourlines relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col">
        <div className="flex items-center gap-3">
          <LogoMark size={40} />
          <Wordmark dark />
        </div>

        <div className="mt-auto max-w-xl">
          <span className="eyebrow mb-4">Matrícula 2027</span>
          <h2 className="font-display text-5xl leading-[1.05] font-extrabold">Matricúlate sabiendo con quién llevas cada curso.</h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-white/70">
            Compara docentes con las reseñas de otros estudiantes y arma un horario sin cruces en minutos.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-5 gap-2" style={{ gridTemplateRows: "repeat(7, 34px)" }} aria-hidden="true">
          {MOSAIC.map((b, i) => {
            const color = NIGHT_COLORS[i % NIGHT_COLORS.length]!;
            return (
              <div
                key={b.name}
                className="block-in overflow-hidden rounded-lg px-2.5 py-1.5 text-[11px] font-semibold"
                style={{
                  gridColumn: b.col + 1,
                  gridRow: `${b.row + 1} / span ${b.h}`,
                  background: `${color}33`,
                  borderLeft: `3px solid ${color}`,
                  animationDelay: `${200 + i * 110}ms`,
                }}
              >
                {b.name}
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <form onSubmit={submit} noValidate className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <LogoMark size={40} />
            <Wordmark />
          </div>

          {imported && (
            <div role="status" className="bg-utp-mint-soft text-utp-mint mb-6 flex gap-2 rounded-xl px-4 py-3 text-sm">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <span>
                Recibimos tu oferta {imported.offer.term}: {imported.offer.courses.length} cursos y {imported.offer.sections.length} secciones. Crea una cuenta o inicia sesión para verla.
              </span>
            </div>
          )}

          <h1 className="text-3xl font-bold">{mode === "login" ? "Bienvenido, estudiante" : "Crear cuenta"}</h1>
          <p className="text-utp-muted mt-2 text-[15px]">
            {mode === "login"
              ? "Ingresa con tu correo institucional y contraseña."
              : "Regístrate con tus datos institucionales para empezar."}
          </p>

          {mode === "register" && (
            <>
              <label className="mt-7 block text-sm font-semibold" htmlFor="name">
                Nombre completo
              </label>
              <input
                id="name"
                autoComplete="name"
                maxLength={80}
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="Leopoldo Brito"
                className="field mt-1.5"
              />
            </>
          )}

          <label className={`${mode === "register" ? "mt-4" : "mt-7"} block text-sm font-semibold`} htmlFor="email">
            Correo institucional
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            placeholder={`u12345678@${UTP_DOMAIN}`}
            className="field mt-1.5"
          />

          <label className="mt-4 block text-sm font-semibold" htmlFor="password">
            Contraseña
          </label>
          <div className="relative mt-1.5">
            <input
              id="password"
              type={passwordVisible ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={mode === "register" ? 12 : undefined}
              maxLength={128}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              className="field pr-12"
            />
            <button
              type="button"
              aria-label={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={passwordVisible}
              onClick={() => setPasswordVisible((visible) => !visible)}
              className="text-utp-muted hover:text-utp-night absolute inset-y-0 right-3 flex items-center"
            >
              {passwordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>

          {mode === "register" && (
            <>
              <label className="mt-4 block text-sm font-semibold" htmlFor="confirmPassword">
                Confirmar contraseña
              </label>
              <div className="relative mt-1.5">
                <input
                  id="confirmPassword"
                  type={confirmPasswordVisible ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  className="field pr-12"
                />
                <button
                  type="button"
                  aria-label={confirmPasswordVisible ? "Ocultar confirmación" : "Mostrar confirmación"}
                  aria-pressed={confirmPasswordVisible}
                  onClick={() => setConfirmPasswordVisible((visible) => !visible)}
                  className="text-utp-muted hover:text-utp-night absolute inset-y-0 right-3 flex items-center"
                >
                  {confirmPasswordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </>
          )}

          {(error || initialError) && (
            <p role="alert" className="bg-utp-red/10 text-utp-red-dark mt-4 rounded-xl px-4 py-2.5 text-sm font-medium">
              {error ?? initialError}
            </p>
          )}

          <button type="submit" disabled={pending} className="btn btn-accent mt-6 w-full py-3.5 text-base disabled:cursor-wait disabled:opacity-70">
            {pending ? "Procesando…" : mode === "login" ? "Ingresar" : "Crear cuenta"}
          </button>

          <p className="text-utp-muted mt-5 text-center text-sm">
            {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes una cuenta?"}{" "}
            <button
              type="button"
              className="text-utp-violet font-semibold underline underline-offset-2"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
                setPassword("");
                setConfirmPassword("");
                setPasswordVisible(false);
                setConfirmPasswordVisible(false);
              }}
            >
              {mode === "login" ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
        </form>
      </section>
    </div>
  );
}
