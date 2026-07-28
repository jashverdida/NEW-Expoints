import { rankForLevel } from "@/lib/exp";
import { cn } from "@/lib/utils";

/**
 * The level chip that sits next to a username. Colour comes from the rank tier,
 * so "Lv.42 Master" is recognisable without reading the number.
 */
export function LevelBadge({
  level,
  showRank = false,
  size = "sm",
  className,
}: {
  level: number;
  showRank?: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const rank = rankForLevel(level);

  const sizing = {
    xs: "px-1.5 py-px text-[0.6rem] gap-1",
    sm: "px-2 py-0.5 text-[0.68rem] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border font-display font-bold uppercase leading-none tracking-wide",
        sizing,
        className,
      )}
      style={{
        color: rank.accent,
        borderColor: `${rank.accent}55`,
        background: `${rank.accent}18`,
      }}
      title={`Level ${level} · ${rank.name}`}
    >
      <span className="stat">LV.{level}</span>
      {showRank && <span className="opacity-80">{rank.name}</span>}
    </span>
  );
}

/** Small gold marker for admins, so moderation carries visible authority. */
export function AdminBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill border border-exp/50 bg-exp/15 px-2 py-0.5",
        "font-display text-[0.62rem] font-bold uppercase tracking-wider text-exp",
        className,
      )}
      title="Administrator"
    >
      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor" aria-hidden="true">
        <path d="M12 1.5 3 5.5v6c0 5.2 3.8 10 9 11.5 5.2-1.5 9-6.3 9-11.5v-6l-9-4Zm0 6.2 1.6 3.4 3.7.5-2.7 2.6.7 3.7-3.3-1.8-3.3 1.8.7-3.7L6.7 11.6l3.7-.5L12 7.7Z" />
      </svg>
      Admin
    </span>
  );
}
