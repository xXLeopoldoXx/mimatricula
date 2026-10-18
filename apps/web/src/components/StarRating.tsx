interface StarRatingProps {
  value: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (v: number) => void;
}

export default function StarRating({ value, max = 5, size = 14, interactive = false, onChange }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = i + 1 <= Math.round(value);
        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill={filled ? "#f59e0b" : "#e5e7eb"}
            style={{ cursor: interactive ? "pointer" : "default", transition: "fill 0.1s" }}
            onClick={() => interactive && onChange?.(i + 1)}
          >
            <path d="M8 1l1.854 4.146L14 5.854l-3 2.854.708 4.146L8 10.5l-3.708 2.354L5 8.708 2 5.854l4.146-.708L8 1z" />
          </svg>
        );
      })}
    </div>
  );
}
