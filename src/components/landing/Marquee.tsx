"use client";

import { cn } from "@/lib/utils";

/**
 * Infinite horizontal ticker of game titles.
 *
 * Replaces the original's fixed vertical box-art strip, which was a pair of
 * multi-megabyte PNGs pinned to the right edge and hidden entirely below
 * 1100px. This renders type instead of bitmaps, so it costs nothing, scales to
 * any width and actually works on phones.
 *
 * The list is duplicated once and translated -50%, which makes the loop seam
 * invisible.
 */
export function Marquee({
  items,
  reverse = false,
  className,
}: {
  items: string[];
  reverse?: boolean;
  className?: string;
}) {
  if (items.length === 0) return null;
  const doubled = [...items, ...items];

  return (
    <div
      className={cn("group relative overflow-hidden fade-edge-x", className)}
      aria-hidden="true"
    >
      <div
        className="flex w-max gap-3 group-hover:[animation-play-state:paused]"
        style={{
          animation: `marquee-x ${Math.max(28, items.length * 3.2)}s linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {doubled.map((title, i) => (
          <span
            key={`${title}-${i}`}
            className="shrink-0 whitespace-nowrap rounded-pill border border-brand-300/15 bg-brand-900/30 px-4 py-2 font-display text-sm font-semibold text-brand-100/75 backdrop-blur-sm"
          >
            {title}
          </span>
        ))}
      </div>
    </div>
  );
}
