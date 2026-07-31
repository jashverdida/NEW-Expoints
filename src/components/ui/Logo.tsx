import { cn } from "@/lib/utils";

/**
 * The EXPoints wordmark, rebuilt as inline SVG rather than the original PNG.
 *
 * Keeps the "+" spark and the big EXP / small OINTS lockup from the logo, but
 * now it's crisp at any size, themeable, and weighs ~1KB instead of a bitmap.
 */
export function Logo({
  className,
  showSpark = true,
}: {
  className?: string;
  showSpark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-baseline gap-1.5 select-none", className)}>
      {showSpark && (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-[0.85em] w-[0.85em] shrink-0 -translate-y-[0.12em] text-brand-300 drop-shadow-[0_0_10px_color-mix(in_oklab,var(--color-brand-400)_90%,transparent)]"
        >
          <path
            fill="currentColor"
            d="M12 0.5 13.9 8.6 22 10.5 13.9 12.4 12 20.5 10.1 12.4 2 10.5 10.1 8.6z"
          />
        </svg>
      )}
      <span className="font-display font-extrabold leading-none tracking-tight">
        <span className="text-gradient">EXP</span>
        <span className="text-[0.62em] font-bold tracking-[0.18em] text-brand-200/90">
          OINTS
        </span>
      </span>
    </span>
  );
}
