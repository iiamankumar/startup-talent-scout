import { cn } from "@/lib/utils";

/**
 * Klyro wordmark — simple uppercase text mark.
 * Renders "KLYRO" in a clean, bold typeface. Uses `currentColor` for inheritance.
 */
export function KlyroMark({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      aria-label="Klyro"
      className={cn(
        "inline-flex items-center justify-center font-semibold tracking-widest text-foreground select-none",
        className
      )}
    >
      KLYRO
    </span>
  );
}

/** Primary logo export — uppercase KLYRO text mark. */
export function KlyroLogo({
  className,
}: {
  className?: string;
}) {
  return <KlyroMark className={className} />;
}

export default KlyroLogo;
