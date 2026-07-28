import { levelProgress, rankForLevel } from "@/lib/exp";
import { cn, compactNumber } from "@/lib/utils";

/**
 * The EXP progress bar — the single most important piece of feedback in the
 * product. Shows the current level, how far into it you are, and exactly how
 * much EXP is left, because "how do I level up" should never be a mystery.
 */
export function ExpBar({
  exp,
  compact = false,
  showNumbers = true,
  className,
}: {
  exp: number;
  compact?: boolean;
  showNumbers?: boolean;
  className?: string;
}) {
  const p = levelProgress(exp);
  const rank = rankForLevel(p.level);

  return (
    <div className={cn("w-full", className)}>
      {showNumbers && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <span
            className="font-display text-[0.7rem] font-bold uppercase tracking-widest"
            style={{ color: rank.accent }}
          >
            {rank.name} · Lv.{p.level}
          </span>
          <span className="stat text-[0.7rem] text-ink-muted">
            {compactNumber(p.intoLevel)}
            <span className="text-ink-faint"> / {compactNumber(p.levelSpan)} EXP</span>
          </span>
        </div>
      )}

      <div
        className={cn(
          "relative w-full overflow-hidden rounded-pill bg-abyss/80 ring-1 ring-inset ring-white/10",
          compact ? "h-1.5" : "h-2.5",
        )}
        role="progressbar"
        aria-valuenow={Math.round(p.percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Level ${p.level} progress`}
      >
        <div
          className="relative h-full rounded-pill transition-[width] duration-700 ease-out"
          style={{
            width: `${Math.max(p.percent, 2.5)}%`,
            background: `linear-gradient(90deg, ${rank.accent}, ${rank.accent}dd, #ffffff88)`,
            boxShadow: `0 0 14px -2px ${rank.glow}`,
          }}
        >
          {/* Sheen sweep — reads as "this is live and earning". */}
          <span
            className="absolute inset-y-0 left-0 w-1/3 skew-x-12 bg-white/35 blur-[3px]"
            style={{ animation: "bar-sheen 2.8s ease-in-out infinite" }}
          />
        </div>
      </div>

      {showNumbers && !compact && (
        <p className="mt-1.5 text-[0.7rem] text-ink-faint">
          <span className="stat text-brand-300">{compactNumber(p.remaining)} EXP</span> to Level{" "}
          {p.level + 1}
        </p>
      )}
    </div>
  );
}
