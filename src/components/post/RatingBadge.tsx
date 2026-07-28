import { cn, ratingVerdict } from "@/lib/utils";

/**
 * The 1–10 review score.
 *
 * The README promised "reviews with star ratings" but the PHP post form never
 * shipped a score field, so every review was just prose. Making the score
 * first-class is what lets games build a real aggregate rating.
 */
export function RatingBadge({
  rating,
  size = "md",
  className,
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { label, color } = ratingVerdict(rating);

  const sizing = {
    sm: { box: "h-9 w-9 text-sm", label: "hidden" },
    md: { box: "h-11 w-11 text-base", label: "text-[0.58rem]" },
    lg: { box: "h-16 w-16 text-2xl", label: "text-[0.65rem]" },
  }[size];

  return (
    <div className={cn("flex flex-col items-center gap-1", className)} title={`${rating}/10 — ${label}`}>
      <div
        className={cn(
          "grid shrink-0 place-items-center rounded-2xl border-2 font-display font-extrabold leading-none",
          sizing.box,
        )}
        style={{
          color,
          borderColor: `${color}66`,
          background: `${color}14`,
          boxShadow: `0 0 20px -6px ${color}99`,
        }}
      >
        {rating}
      </div>
      <span
        className={cn("font-display font-bold uppercase tracking-widest", sizing.label)}
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}
