import { cn } from "@/lib/utils";

/**
 * Klyro mark — Mercor-style single-letter glyph.
 * A sculpted lowercase "k" rendered as a single SVG mark in solid black,
 * sized to sit alone like Mercor's "M" — no wordmark beside it.
 * Uses `currentColor` so it inherits color from its parent (defaults to black via text-foreground).
 */
export function KlyroMark({
  className,
  size = 32,
}: {
  className?: string;
  /** Pixel size of the square mark */
  size?: number;
}) {
  return (
    <span
      aria-label="Klyro"
      className={cn("inline-flex items-center justify-center text-foreground", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Vertical stem with soft, sculpted ends */}
        <path d="M14 6 C18 6 21 9 21 13 L21 51 C21 55 18 58 14 58 C10 58 7 55 7 51 L7 13 C7 9 10 6 14 6 Z" />
        {/* Upper diagonal arm — flowing into the stem */}
        <path d="M44 18 C48 14 54 14 57 17 C60 21 59 26 55 30 L34 47 C30 50 25 49 23 45 C21 41 23 36 26 33 Z" />
        {/* Lower diagonal leg — mirrored sweep */}
        <path d="M26 31 C23 28 23 23 26 20 C29 17 34 17 37 21 L57 47 C60 51 59 56 55 58 C51 60 46 59 43 55 Z" />
      </svg>
    </span>
  );
}

/** Primary logo export — same single-letter mark as Mercor's "M". */
export function KlyroLogo({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return <KlyroMark className={className} size={size} />;
}

export default KlyroLogo;
