"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The hide / show control, shared by all four dock surfaces so the affordance
 * is recognisably the same button whichever edge it's sitting on.
 *
 * Two tones:
 *  - `quiet`  — lives in a card header. Nearly invisible until the column is
 *    hovered, because "hide this" should never compete with the content it's
 *    attached to.
 *  - `edge`   — lives on a collapsed rail, where it IS the content and has to
 *    look pressable on its own.
 */
export function DockToggle({
  label,
  icon: Icon,
  onClick,
  tone = "quiet",
  className,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  tone?: "quiet" | "edge";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid shrink-0 place-items-center rounded-xl transition-[background-color,border-color,color,translate,box-shadow] duration-200",
        tone === "quiet"
          ? "h-8 w-8 text-ink-faint hover:bg-white/8 hover:text-brand-200 active:translate-y-px"
          : "h-11 w-11 border border-brand-400/25 bg-brand-500/12 text-brand-200 hover:border-brand-400/50 hover:bg-brand-500/22 hover:text-brand-100 hover:shadow-[0_0_22px_-8px_var(--color-brand-400)] active:translate-y-px",
        className,
      )}
    >
      <Icon className={tone === "quiet" ? "h-4 w-4" : "h-5 w-5"} />
    </button>
  );
}
