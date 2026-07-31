import { cn } from "@/lib/utils";

/**
 * One line of a settings panel: what it is on the left, the control on the
 * right, and an explanation underneath that isn't optional.
 *
 * A settings screen lives or dies on whether people can tell what a control
 * will do before they touch it, so `hint` is a required prop rather than a
 * nicety someone can forget.
 */
export function SettingRow({
  label,
  hint,
  control,
  className,
}: {
  label: string;
  hint: string;
  control: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-x-6 gap-y-3 py-4",
        "border-b border-white/6 last:border-b-0 last:pb-0 first:pt-0",
        className,
      )}
    >
      <div className="min-w-0 flex-1 basis-56">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-faint">{hint}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{control}</div>
    </div>
  );
}

/** A read-only value, for the things settings can show but not change here. */
export function SettingValue({ children }: { children: React.ReactNode }) {
  return (
    <span className="stat rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-xs text-ink-muted">
      {children}
    </span>
  );
}
