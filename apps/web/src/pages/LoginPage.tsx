import { useState, type FormEvent } from "react";
import { UTP_DOMAIN, type CatalogImport } from "@mimatricula/shared";

interface Props {
  onLogin: (email: string, name: string) => string | null;
  /** Oferta recibida de la extensión antes de iniciar sesión. */
  imported?: CatalogImport | null;
}

export default function LoginPage({ onLogin, imported }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(onLogin(email, name));
  };

  const input =
    "mt-1 w-full rounded-md border border-utp-line px-3 py-2.5 text-sm outline-none focus:border-utp-violet focus:ring-2 focus:ring-utp-violet/20";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-utp-red text-lg font-black text-white">M+</div>
          <div>
            <div className="text-lg font-black leading-tight">MiMatrícula</div>
            <div className="text-xs text-utp-muted">Matrícula inteligente y reseñas estudiantiles</div>
          </div>
        </div>

        {imported && (
          <div role="status" className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            ✓ Recibimos tu oferta {imported.offer.term}: {imported.offer.courses.length} cursos y{" "}
            {imported.offer.sections.length} secciones. Inicia sesión para verla.
          </div>
        )}

        <h1 className="text-xl font-bold">Bienvenido, estudiante</h1>
        <p className="mt-1 text-sm text-utp-muted">Ingresa con tu correo institucional para personalizar tu matrícula.</p>

        <label className="mt-5 block text-sm font-bold" htmlFor="name">
          Nombre
        </label>
        <input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Leopoldo Brito" className={input} />

        <label className="mt-4 block text-sm font-bold" htmlFor="email">
          Correo institucional
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={`u12345678@${UTP_DOMAIN}`}
          className={input}
        />

        {error && (
          <p role="alert" className="mt-3 rounded-md bg-utp-red/10 px-3 py-2 text-sm text-utp-red-dark">
            {error}
          </p>
        )}

        <button type="submit" className="mt-5 w-full rounded-md bg-utp-violet py-2.5 text-sm font-bold text-white hover:bg-utp-violet-dark">
          Ingresar
        </button>

        <p className="mt-4 text-center text-[11px] leading-snug text-utp-muted">
          Versión de demostración: solo se valida que el correo termine en @{UTP_DOMAIN}.
        </p>
      </form>
    </div>
  );
}
