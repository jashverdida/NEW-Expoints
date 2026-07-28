import Link from "next/link";
import { PenSquare, SearchX } from "lucide-react";

/** Shown when a feed, search or list has nothing to render. */
export function EmptyState({
  title,
  body,
  action,
  variant = "empty",
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
  variant?: "empty" | "search";
}) {
  const Icon = variant === "search" ? SearchX : PenSquare;

  return (
    <div className="glass flex flex-col items-center rounded-3xl px-6 py-16 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/12 text-brand-300 ring-1 ring-brand-400/20">
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">{body}</p>
      {action && (
        <Link
          href={action.href}
          className="btn-primary mt-6 inline-flex h-11 items-center rounded-xl px-6 text-sm"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
