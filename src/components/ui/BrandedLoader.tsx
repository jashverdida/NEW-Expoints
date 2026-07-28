import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

/**
 * Full-page branded loading state.
 *
 * Used for first paint on the landing page and the auth screens, where there's
 * no existing layout to skeleton into — a bare white flash there is the worst
 * first impression the app can make.
 *
 * The centrepiece is a filling EXP bar, which is both on-brand and honest: it
 * communicates "loading" using the exact visual language the product runs on.
 * Pure CSS, no JS, so it renders instantly while the page streams.
 */
export function BrandedLoader({
  label = "Loading",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("grid min-h-dvh place-items-center px-6", className)}
      role="status"
      aria-live="polite"
    >
      <div className="flex w-full max-w-xs flex-col items-center">
        {/* The spark pulses on its own timing so the mark feels alive. */}
        <div className="animate-pulse-soft">
          <Logo className="text-3xl" />
        </div>

        {/* Indeterminate EXP bar — a sweep travels the track rather than
            claiming a percentage we don't know. */}
        <div className="mt-7 h-2 w-full overflow-hidden rounded-pill bg-abyss/80 ring-1 ring-inset ring-white/10">
          <div className="loader-sweep h-full w-1/3 rounded-pill" />
        </div>

        <p className="stat mt-3.5 text-[0.68rem] font-bold uppercase tracking-[0.3em] text-ink-faint">
          {label}
        </p>
      </div>
    </div>
  );
}
