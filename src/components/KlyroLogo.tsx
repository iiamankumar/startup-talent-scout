import { cn } from "@/lib/utils";

/**
 * Klyro wordmark — modeled on the Mercor mark:
 * lowercase, geometric sans, near-black, tight tracking, no icon.
 * Uses `currentColor` so it inherits color from its parent.
 */
export function KlyroLogo({
  className,
  size = 22,
}: {
  className?: string;
  /** Font size in px for the wordmark */
  size?: number;
}) {
  return (
    <span
      aria-label="Klyro"
      className={cn(
        "inline-block select-none font-sans font-semibold leading-none",
        "text-foreground",
        className
      )}
      style={{
        fontSize: `${size}px`,
        letterSpacing: "-0.045em",
        fontFeatureSettings: '"ss01", "cv11"',
      }}
    >
      klyro
    </span>
  );
}

/** Convenience export when only the mark concept is wanted (same wordmark for now). */
export function KlyroMark({
  className,
  size = 22,
}: {
  className?: string;
  size?: number;
}) {
  return <KlyroLogo className={className} size={size} />;
}

export default KlyroLogo;
