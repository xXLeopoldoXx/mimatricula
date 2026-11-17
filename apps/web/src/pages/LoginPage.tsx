import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  TriangleAlert,
  User,
  type LucideIcon,
} from "lucide-react";
import {
  LoginSchema,
  RegistrationSchema,
  UTP_DOMAIN,
  type CatalogImport,
  type LoginInput,
  type RegistrationInput,
} from "@mimatricula/shared";
import { LogoMark, Wordmark } from "../components/Logo";
import AuthScene, { AUTH_FEATURES, GeoRings } from "../components/AuthScene";

interface Props {
  onLogin: (input: LoginInput) => Promise<string | null>;
  onRegister: (input: RegistrationInput) => Promise<string | null>;
  /** Oferta recibida de la extensión antes de iniciar sesión. */
  imported?: CatalogImport | null;
  initialError?: string | null;
}

type Mode = "login" | "register";
type FieldKey = "name" | "email" | "password" | "confirmPassword";
const FIELD_ORDER: FieldKey[] = ["name", "email", "password", "confirmPassword"];

const PASSWORD_RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: "12 caracteres o más", test: (v) => v.length >= 12 },
  { label: "Mayúscula y minúscula", test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { label: "Un número", test: (v) => /\d/.test(v) },
  { label: "Un símbolo (!, #, $…)", test: (v) => /[^A-Za-z0-9\s]/.test(v) },
];
const STRENGTH = [
  { label: "Muy débil", bar: "bg-utp-red" },
  { label: "Débil", bar: "bg-utp-red" },
  { label: "Regular", bar: "bg-utp-orange" },
  { label: "Buena", bar: "bg-utp-star" },
  { label: "Segura", bar: "bg-utp-green-dark" },
] as const;

export default function LoginPage({ onLogin, onRegister, imported, initialError }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [pending, setPending] = useState(false);

  const isRegister = mode === "register";

  // Validación en vivo con los mismos esquemas que usa el servidor; se muestra al salir del campo
  const issues = useMemo(() => {
    const result = isRegister
      ? RegistrationSchema.safeParse({ name, email, password, confirmPassword })
      : LoginSchema.safeParse({ email, password });
    const map: Partial<Record<FieldKey, string>> = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]) as FieldKey;
        if (!(key in map)) map[key] = issue.message;
      }
    }
    return map;
  }, [isRegister, name, email, password, confirmPassword]);

  const fieldError = (key: FieldKey) => (touched[key] || submitted ? issues[key] : undefined);
  const touch = (key: FieldKey) => setTouched((t) => ({ ...t, [key]: true }));

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setError(null);
    setSubmitted(false);
    setTouched({});
    setPassword("");
    setConfirmPassword("");
    setPasswordVisible(false);
    setConfirmVisible(false);
    setCapsOn(false);
  };

  const fail = (message: string) => {
    setError(message);
    setShaking(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitted(true);

    const firstInvalid = FIELD_ORDER.find((k) => (isRegister || k !== "name" && k !== "confirmPassword") && issues[k]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      setShaking(true);
      return;
    }

    setPending(true);
    try {
      if (isRegister) {
        const parsed = RegistrationSchema.safeParse({ name, email, password, confirmPassword });
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Revisa los datos ingresados");
        const message = await onRegister(parsed.data);
        if (message) fail(message);
      } else {
        const parsed = LoginSchema.safeParse({ email, password });
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Revisa los datos ingresados");
        const message = await onLogin(parsed.data);
        if (message) fail(message);
      }
    } finally {
      setPending(false);
    }
  };

  // Si el usuario escribe solo su código (u12345678), completamos el dominio al salir del campo
  const completeEmail = () => {
    touch("email");
    const value = email.trim();
    if (/^u\d{8}$/i.test(value)) setEmail(`${value.toLowerCase()}@${UTP_DOMAIN}`);
  };

  const rulesOk = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const strength = STRENGTH[password ? rulesOk : 0]!;
  const showError = error ?? initialError;
  const trackCaps = (e: React.KeyboardEvent) => setCapsOn(e.getModifierState?.("CapsLock") ?? false);

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.08fr_1fr]">
      {/* ───── Panel de marca ───── */}
      <section className="geo-bg relative hidden overflow-hidden p-10 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col xl:p-14">
        <GeoRings />

        <div className="reveal relative flex items-center gap-3" style={{ ["--i" as string]: 0 }}>
          <LogoMark size={40} />
          <Wordmark dark />
        </div>

        <div className="relative flex flex-1 items-center justify-center py-6 [@media(max-height:760px)]:hidden">
          <AuthScene />
        </div>

        <div className="relative mt-auto max-w-xl [@media(max-height:760px)]:mt-12">
          <span className="reveal eyebrow mb-4" style={{ ["--i" as string]: 1 }}>
            <span className="bg-utp-orange h-0.5 w-6" /> Matrícula 2027
          </span>
          <h2 className="reveal font-display text-4xl leading-[1.08] font-extrabold xl:text-5xl" style={{ ["--i" as string]: 2 }}>
            Matricúlate sabiendo con quién llevas cada curso.
          </h2>
          <p className="reveal mt-4 max-w-md text-base leading-relaxed text-white/70" style={{ ["--i" as string]: 3 }}>
            Compara docentes con las reseñas de otros estudiantes y arma un horario sin cruces en minutos.
          </p>
          <ul className="reveal mt-6 flex flex-wrap gap-x-6 gap-y-3" style={{ ["--i" as string]: 4 }}>
            {AUTH_FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-sm font-semibold text-white/85">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <Icon size={16} aria-hidden="true" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───── Formulario ───── */}
      <section className="relative flex items-center justify-center overflow-hidden px-4 py-8 sm:px-8">
        <div className="grid-paper pointer-events-none absolute inset-0" aria-hidden="true" />

        <div className="relative w-full max-w-md">
          {/* Cabecera móvil: la misma marca, en versión compacta */}
          <div className="geo-bg reveal mb-5 flex items-center gap-3 rounded-2xl p-4 text-white lg:hidden">
            <LogoMark size={36} />
            <div>
              <Wordmark dark />
              <p className="text-xs text-white/70">Matrícula 2027 · sin cruces</p>
            </div>
          </div>

          <div className="page-in">
            <form
              onSubmit={submit}
              noValidate
              aria-labelledby="auth-title"
              onAnimationEnd={(e) => e.animationName === "shake" && setShaking(false)}
              className={`card relative p-6 sm:p-8 ${shaking ? "shake" : ""}`}
            >
              <span className="bg-utp-orange absolute -top-px left-8 h-1 w-14 rounded-b-sm" aria-hidden="true" />

              {imported && (
                <div role="status" className="bg-utp-mint-soft text-utp-mint mb-5 flex gap-2 rounded-xl px-4 py-3 text-sm">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                  <span>
                    Recibimos tu oferta {imported.offer.term}: {imported.offer.courses.length} cursos y {imported.offer.sections.length} secciones. Crea una cuenta o inicia sesión para verla.
                  </span>
                </div>
              )}

              {/* Selector de modo: control segmentado con indicador deslizante */}
              <div role="tablist" aria-label="Acceso" className="bg-utp-bg relative grid grid-cols-2 rounded-xl p-1">
                <span
                  aria-hidden="true"
                  className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm transition-transform duration-300 ease-[var(--ease-out-expo)]"
                  style={{ transform: isRegister ? "translateX(100%)" : "none" }}
                />
                {(["login", "register"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => switchMode(m)}
                    className={`relative z-10 rounded-lg py-2 text-sm font-bold transition-colors ${mode === m ? "text-utp-violet" : "text-utp-muted hover:text-utp-ink"}`}
                  >
                    {m === "login" ? "Iniciar sesión" : "Crear cuenta"}
                  </button>
                ))}
              </div>

              <div key={mode} className="reveal mt-6">
                <h1 id="auth-title" className="text-2xl font-bold sm:text-[1.7rem]">
                  {isRegister ? "Crea tu cuenta" : "Bienvenido, estudiante"}
                </h1>
                <p className="text-utp-muted mt-1.5 text-[15px]">
                  {isRegister ? "Usa tu correo institucional para empezar a armar tu horario." : "Ingresa con tu correo institucional y contraseña."}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-4">
                <Collapse open={isRegister}>
                  <TextField
                    id="name"
                    label="Nombre completo"
                    icon={User}
                    autoComplete="name"
                    maxLength={80}
                    value={name}
                    onChange={(v) => {
                      setName(v);
                      setError(null);
                    }}
                    onBlur={() => touch("name")}
                    error={fieldError("name")}
                    placeholder="Leopoldo Brito"
                    disabled={!isRegister}
                  />
                </Collapse>

                <TextField
                  id="email"
                  label="Correo institucional"
                  icon={Mail}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  maxLength={254}
                  autoFocus
                  value={email}
                  onChange={(v) => {
                    setEmail(v);
                    setError(null);
                  }}
                  onBlur={completeEmail}
                  error={fieldError("email")}
                  hint={`Tu código de alumno + @${UTP_DOMAIN}`}
                  placeholder={`u12345678@${UTP_DOMAIN}`}
                />

                <div>
                  <TextField
                    id="password"
                    label="Contraseña"
                    icon={Lock}
                    type={passwordVisible ? "text" : "password"}
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    maxLength={128}
                    value={password}
                    onChange={(v) => {
                      setPassword(v);
                      setError(null);
                    }}
                    onBlur={() => {
                      touch("password");
                      setPasswordFocused(false);
                      setCapsOn(false);
                    }}
                    onFocus={() => setPasswordFocused(true)}
                    onKeyUp={trackCaps}
                    onKeyDown={trackCaps}
                    error={fieldError("password")}
                    trailing={<VisibilityToggle visible={passwordVisible} onToggle={() => setPasswordVisible((v) => !v)} label="contraseña" />}
                  />
                  {capsOn && (
                    <p className="text-utp-orange-dark mt-1.5 flex items-center gap-1.5 text-xs font-semibold">
                      <TriangleAlert size={14} aria-hidden="true" /> Bloq Mayús está activado
                    </p>
                  )}

                  {/* Requisitos de la contraseña: solo al crear cuenta, con avance en vivo */}
                  <Collapse open={isRegister && (passwordFocused || password.length > 0)}>
                    <div className="bg-utp-bg mt-3 rounded-xl p-3.5" aria-live="polite">
                      <div className="flex items-center gap-1.5" aria-hidden="true">
                        {[0, 1, 2, 3].map((i) => (
                          <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i < rulesOk && password ? strength.bar : "bg-utp-line"}`} />
                        ))}
                      </div>
                      <div className="text-utp-muted mt-2 text-xs font-semibold">
                        Seguridad: <span className="text-utp-ink">{strength.label}</span>
                      </div>
                      <ul className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {PASSWORD_RULES.map((rule) => {
                          const ok = rule.test(password);
                          return (
                            <li key={rule.label} className={`flex items-center gap-2 text-xs font-medium transition-colors ${ok ? "text-utp-mint" : "text-utp-muted"}`}>
                              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors ${ok ? "bg-utp-mint text-white" : "bg-utp-line"}`}>
                                {ok && <Check size={11} strokeWidth={3.5} aria-hidden="true" />}
                              </span>
                              {rule.label}
                              <span className="sr-only">{ok ? " (cumplido)" : " (pendiente)"}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </Collapse>
                </div>

                <Collapse open={isRegister}>
                  <TextField
                    id="confirmPassword"
                    label="Confirmar contraseña"
                    icon={Lock}
                    type={confirmVisible ? "text" : "password"}
                    autoComplete="new-password"
                    maxLength={128}
                    value={confirmPassword}
                    onChange={(v) => {
                      setConfirmPassword(v);
                      setError(null);
                    }}
                    onBlur={() => touch("confirmPassword")}
                    error={fieldError("confirmPassword")}
                    success={confirmPassword.length > 0 && confirmPassword === password ? "Las contraseñas coinciden" : undefined}
                    disabled={!isRegister}
                    trailing={<VisibilityToggle visible={confirmVisible} onToggle={() => setConfirmVisible((v) => !v)} label="confirmación" disabled={!isRegister} />}
                  />
                </Collapse>
              </div>

              {showError && (
                <p role="alert" className="bg-utp-red/10 text-utp-red-dark mt-5 flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium">
                  <CircleAlert size={18} className="mt-px shrink-0" aria-hidden="true" />
                  {showError}
                </p>
              )}

              <button type="submit" disabled={pending} className="btn btn-accent group mt-6 w-full py-3.5 text-base disabled:cursor-wait disabled:opacity-80">
                {pending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                    {isRegister ? "Creando tu cuenta…" : "Verificando…"}
                  </>
                ) : (
                  <>
                    {isRegister ? "Crear cuenta" : "Ingresar"}
                    <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                  </>
                )}
              </button>

              <p className="text-utp-muted mt-5 text-center text-sm">
                {isRegister ? "¿Ya tienes una cuenta?" : "¿No tienes cuenta?"}{" "}
                <button type="button" className="text-utp-violet font-bold underline-offset-2 hover:underline" onClick={() => switchMode(isRegister ? "login" : "register")}>
                  {isRegister ? "Inicia sesión" : "Regístrate"}
                </button>
              </p>
            </form>
          </div>

          <p className="text-utp-muted mt-5 flex items-center justify-center gap-2 text-xs">
            <ShieldCheck size={14} aria-hidden="true" /> Acceso exclusivo con correo institucional @{UTP_DOMAIN}
          </p>
        </div>
      </section>
    </div>
  );
}

/** Contenedor que se pliega con transición de altura; los campos de dentro dejan de ser enfocables al cerrarse. */
function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className="fold" data-open={open} inert={!open} aria-hidden={!open}>
      <div>{children}</div>
    </div>
  );
}

function VisibilityToggle({ visible, onToggle, label, disabled }: { visible: boolean; onToggle: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={`${visible ? "Ocultar" : "Mostrar"} ${label}`}
      aria-pressed={visible}
      disabled={disabled}
      onClick={onToggle}
      className="text-utp-muted hover:text-utp-violet hover:bg-utp-violet-soft absolute inset-y-1.5 right-1.5 flex w-9 items-center justify-center rounded-lg transition-colors"
    >
      {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
    </button>
  );
}

interface TextFieldProps {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onKeyUp?: (e: React.KeyboardEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  error?: string;
  success?: string;
  hint?: string;
  trailing?: ReactNode;
  type?: string;
  inputMode?: "email" | "text";
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
}

function TextField({ id, label, icon: Icon, value, onChange, onBlur, onFocus, onKeyUp, onKeyDown, error, success, hint, trailing, type = "text", disabled, ...rest }: TextFieldProps) {
  const describedBy = error ? `${id}-msg` : success || hint ? `${id}-msg` : undefined;
  return (
    <div>
      <label className="text-sm font-semibold" htmlFor={id}>
        {label}
      </label>
      <div className="group relative mt-1.5">
        <Icon size={18} aria-hidden="true" className={`pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 transition-colors ${error ? "text-utp-red" : "text-utp-muted group-focus-within:text-utp-violet"}`} />
        <input
          id={id}
          type={type}
          value={value}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onFocus={onFocus}
          onKeyUp={onKeyUp}
          onKeyDown={onKeyDown}
          className={`field pl-11 ${trailing ? "pr-12" : ""} ${error ? "border-utp-red focus:border-utp-red focus:ring-utp-red/15" : ""}`}
          {...rest}
        />
        {trailing}
      </div>
      {error ? (
        <p id={`${id}-msg`} className="text-utp-red-dark mt-1.5 flex items-start gap-1.5 text-xs font-semibold">
          <CircleAlert size={14} className="mt-px shrink-0" aria-hidden="true" /> {error}
        </p>
      ) : success ? (
        <p id={`${id}-msg`} className="text-utp-mint mt-1.5 flex items-center gap-1.5 text-xs font-semibold">
          <CheckCircle2 size={14} aria-hidden="true" /> {success}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="text-utp-muted mt-1.5 text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
