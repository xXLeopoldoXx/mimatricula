/** Marca de MiMatrícula: una M hecha de líneas y un "+" (más opciones). */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true" className="shrink-0">
      <rect width="36" height="36" rx="10" fill="#f0384b" />
      <path d="M8 25V12.5L14 20l6-7.5V25" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M27 9v7M23.5 12.5h7" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ dark = false }: { dark?: boolean }) {
  return (
    <span className={`font-display text-xl font-extrabold tracking-tight ${dark ? "text-white" : "text-utp-ink"}`}>MiMatrícula</span>
  );
}
