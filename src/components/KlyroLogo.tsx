import { cn } from "@/lib/utils";

/**
 * Klyro brand mark — minimal geometric "K".
 * A vertical bar + a crisp chevron meeting at center, in the spirit of
 * Mercor / Linear / Vercel marks. Uses `currentColor` so it inherits
 * from text color (works in light + dark).
 */
export function KlyroMark({
  className,
  size = 20,
  title = "Klyro",
}: {
  className?: string;
  size?: number;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label={title}
      className={cn("shrink-0", className)}
    >
      {/* Vertical stroke */}
      <rect x="3.5" y="3" width="2.6" height="18" rx="0.3" fill="currentColor" />
      {/* Upper diagonal */}
      <path
        d="M6.1 12 L18.5 3.3 L20.6 5.4 L8.2 14.1 Z"
        fill="currentColor"
      />
      {/* Lower diagonal */}
      <path
        d="M6.1 12 L20.6 18.6 L19.5 21 L6.1 14.4 Z"
        fill="currentColor"
      />
      {/* Pivot accent — tiny dot at the chevron joint, the Klyro "spark" */}
      <circle cx="7.2" cy="12" r="1.15" fill="currentColor" />
    </svg>
  );
}

/**
 * Full lockup: mark + wordmark.
 * Wordmark is set in the project font with very tight tracking, all-caps,
 * uppercase — the Mercor approach (mark stays the hero, word is a label).
 */
export function KlyroLogo({
  className,
  size = 20,
  showWord = true,
}: {
  className?: string;
  size?: number;
  showWord?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <KlyroMark size={size} />
      {showWord && (
        <span className="text-sm font-semibold uppercase tracking-[0.18em]">
          Klyro
        </span>
      )}
    </span>
  );
}

export default KlyroLogo;
