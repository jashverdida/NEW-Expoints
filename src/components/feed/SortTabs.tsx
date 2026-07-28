"use client";

import { Clock, Flame, Trophy } from "lucide-react";
import type { FeedSort } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS: { value: FeedSort; label: string; icon: React.ElementType; hint: string }[] = [
  { value: "hot", label: "Hot", icon: Flame, hint: "Trending right now" },
  { value: "new", label: "New", icon: Clock, hint: "Freshest reviews" },
  { value: "top", label: "Top", icon: Trophy, hint: "Most starred of all time" },
];

/**
 * Feed sort switcher.
 *
 * Buttons, not links. Previously each tab was an <a href="/feed?sort=…">, so
 * clicking one triggered a full route navigation and the UI sat unchanged until
 * the server responded. Now the parent swaps already-loaded data and the active
 * state moves on the very next frame.
 *
 * The moving indicator is a single absolutely-positioned element whose
 * transform is driven by the active index — it slides between tabs rather than
 * cross-fading three separate backgrounds, which is both smoother and cheaper.
 */
export function SortTabs({
  active,
  onChange,
  busy = false,
}: {
  active: FeedSort;
  onChange: (sort: FeedSort) => void;
  busy?: boolean;
}) {
  const activeIndex = TABS.findIndex((t) => t.value === active);

  return (
    <div
      role="tablist"
      aria-label="Sort reviews"
      className="glass relative flex items-center gap-1 rounded-2xl p-1.5"
    >
      {/* Sliding indicator. 200ms is long enough to read as movement and short
          enough that it never feels like waiting. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-1.5 left-1.5 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-[0_6px_20px_-6px_rgba(56,160,255,0.8)] transition-transform duration-200 ease-out"
        style={{
          width: `calc((100% - 0.75rem) / ${TABS.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />

      {TABS.map(({ value, label, icon: Icon, hint }) => {
        const isActive = active === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={isActive}
            title={hint}
            onClick={() => onChange(value)}
            className={cn(
              "relative z-10 flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-200",
              isActive ? "text-[#041124]" : "text-ink-muted hover:text-ink",
            )}
          >
            <Icon className={cn("h-4 w-4", isActive && busy && "animate-spin")} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
