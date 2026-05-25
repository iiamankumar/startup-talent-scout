import { cn } from "@/lib/utils";

/**
 * Aveiq wordmark — simple uppercase text mark.
 * Renders "AVEIQ" in a clean, bold typeface. Uses `currentColor` for inheritance.
 */
export function AveiqMark({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      aria-label="Aveiq"
      className={cn(
        "inline-flex items-center justify-center font-semibold tracking-widest text-foreground select-none",
        className
      )}
    >
      AVEIQ
    </span>
  );
}

/** Primary logo export — uppercase AVEIQ text mark. */
export function AveiqLogo({
  className,
}: {
  className?: string;
}) {
  return <AveiqMark className={className} />;
}

export default AveiqLogo;
