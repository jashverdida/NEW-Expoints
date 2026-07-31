"use client";

import { cn } from "@/lib/utils";

/**
 * A toggle.
 *
 * `role="switch"` with `aria-checked` rather than a styled checkbox: this
 * commits immediately — there's no form to submit — and a switch is the control
 * that says so. A checkbox implies "and then save".
 */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-pill border transition-colors duration-200",
        checked
          ? "border-brand-400/50 bg-gradient-to-r from-brand-500/70 to-brand-400/70"
          : "border-white/12 bg-white/6 hover:border-white/20",
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-[left,background-color,box-shadow] duration-200 ease-[var(--ease-out-expo)]",
          checked
            ? "left-[calc(100%-1.375rem)] bg-ink shadow-[0_0_12px_-2px_var(--color-brand-300)]"
            : "left-1 bg-ink-faint",
        )}
      />
    </button>
  );
}
