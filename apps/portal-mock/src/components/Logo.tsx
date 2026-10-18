/** Marca genérica "inspirada en" el portal; no usa el logo oficial. */
export default function Logo() {
  return (
    <div className="flex items-center gap-2 select-none">
      <div className="flex gap-0.5">
        {["U", "T", "P"].map((l) => (
          <span key={l} className="flex h-7 w-6 items-center justify-center bg-utp-ink text-sm font-black text-white md:h-8 md:w-7">
            {l}
          </span>
        ))}
      </div>
      <span className="text-2xl font-black text-utp-red">+</span>
      <span className="hidden rounded bg-utp-violet-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-utp-violet sm:inline">
        Simulación
      </span>
    </div>
  );
}
