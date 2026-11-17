import { Star } from "lucide-react";

/** Estrellas de solo lectura (admite medias). */
export function Stars({ value, size = 14, empty = "text-utp-line" }: { value: number; size?: number; empty?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className={`absolute inset-0 ${empty}`} fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} className="text-utp-star" fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** Selector de 1 a 5 estrellas para el formulario de reseña. */
export function StarInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium">{label}</span>
      <span className="flex" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} estrella${i > 1 ? "s" : ""}`}
            onClick={() => onChange(i)}
            className="rounded p-0.5 transition-transform hover:scale-110"
          >
            <Star size={22} className={i <= value ? "text-utp-star" : "text-utp-line"} fill="currentColor" strokeWidth={0} />
          </button>
        ))}
      </span>
    </div>
  );
}
