"use client";

import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A segmented picker for two or three short options, and a native select for
 * anything longer.
 *
 * Segments read better than a dropdown when every option fits on screen — you
 * can see what you didn't pick. Past about three, or once the labels get long,
 * they wrap badly and a select is simply the better control.
 */
export function Segments<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/4 p-1"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-200",
              active
                ? "bg-gradient-to-br from-brand-400 to-brand-600 text-ink-on-accent"
                : "text-ink-muted hover:bg-white/6 hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Native select, styled.
 *
 * Native on purpose: on a phone this becomes the OS picker, which is a wheel
 * you already know how to use rather than a bespoke listbox that traps focus
 * and fights the keyboard.
 */
export function Choice<T extends string>({
  value,
  options,
  onChange,
  label,
  icon,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (next: T) => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <span className="relative inline-flex items-center">
      {icon && (
        <span className="pointer-events-none absolute left-3 text-ink-faint">{icon}</span>
      )}

      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={cn(
          "h-10 appearance-none rounded-xl border border-white/10 bg-white/4 py-2 pr-9 text-sm font-semibold text-ink",
          "transition-colors hover:border-brand-400/40 focus:border-brand-400/60 focus:outline-none",
          icon ? "pl-9" : "pl-3",
        )}
      >
        {options.map((option) => (
          // Options render in the OS's own chrome, which our styling can't
          // reach — hence the explicit dark background so light-mode systems
          // don't show white-on-white.
          <option key={option.value} value={option.value} className="bg-abyss text-ink">
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-ink-faint" />
    </span>
  );
}

/** Confirmation tick, for a control that has just committed. */
export function SavedTick({ show }: { show: boolean }) {
  return (
    <Check
      aria-hidden="true"
      className={cn(
        "h-4 w-4 text-success transition-opacity duration-300",
        show ? "opacity-100" : "opacity-0",
      )}
    />
  );
}
