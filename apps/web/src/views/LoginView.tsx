import { useState, type FormEvent } from "react";
import { UTP_DOMAIN, type CatalogImport } from "@mimatricula/shared";

interface Props {
  onLogin: (email: string, name: string) => string | null;
  /** Oferta recibida de la extensión antes de iniciar sesión. */
  imported?: CatalogImport | null;
}

export default function LoginView({ onLogin, imported }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(onLogin(email, name));
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-[#f0f2f5] px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-[#e2e6ea] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#c8293a] text-lg font-bold text-white">
            M+
          </div>
          <div>
            <div className="text-lg font-bold leading-tight text-[#111827]">MiMatrícula</div>
            <div className="text-xs text-[#9ca3af]">Matrícula inteligente y reseñas estudiantiles</div>
          </div>
        </div>

        {imported && (
          <div role="status" className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            ✓ Recibimos tu oferta {imported.offer.term}: {imported.offer.courses.length} cursos y{" "}
            {imported.offer.sections.length} secciones. Inicia sesión para verla.
          </div>
        )}

        <h1 className="text-xl font-bold text-[#111827]">Bienvenido, estudiante</h1>
        <p className="mt-1 text-sm text-[#4b5563]">Ingresa con tu correo institucional para personalizar tu matrícula.</p>

        <label className="mt-5 block text-sm font-medium text-[#111827]" htmlFor="name">
          Nombre
        </label>
        <input
          id="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Leopoldo Brito"
          className="mt-1 w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm outline-none focus:border-[#c8293a] focus:ring-2 focus:ring-[#c8293a]/20"
        />

        <label className="mt-4 block text-sm font-medium text-[#111827]" htmlFor="email">
          Correo institucional
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={`u12345678@${UTP_DOMAIN}`}
          className="mt-1 w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm outline-none focus:border-[#c8293a] focus:ring-2 focus:ring-[#c8293a]/20"
        />

        {error && (
          <p role="alert" className="mt-3 rounded-md bg-[#c8293a]/10 px-3 py-2 text-sm text-[#a31e2b]">
            {error}
          </p>
        )}

        <button type="submit" className="mt-5 w-full rounded-md bg-[#c8293a] py-2.5 text-sm font-semibold text-white hover:bg-[#a31e2b]">
          Ingresar
        </button>

        <p className="mt-4 text-center text-[11px] leading-snug text-[#9ca3af]">
          Versión de demostración: solo se valida que el correo termine en @{UTP_DOMAIN}.
        </p>
      </form>
    </div>
  );
}
