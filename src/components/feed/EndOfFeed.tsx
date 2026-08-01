"use client";

import { useT } from "@/components/shell/PrefsProvider";

/**
 * The full stop at the bottom of a list.
 *
 * Without one, the last card just runs into the footer and it's genuinely
 * ambiguous whether you reached the end or something failed to load. A rule
 * across the column with a mark in the middle answers that in one glance — the
 * same way a printed page ends a chapter.
 *
 * The glyph is the PlayStation motif the rest of the app is built on, so this
 * reads as part of the furniture rather than a stray notice.
 */
export function EndOfFeed() {
  const t = useT();

  return (
    <div className="mt-10 mb-2 flex flex-col items-center gap-3" role="status">
      <div className="flex w-full items-center gap-4">
        <span
          aria-hidden="true"
          className="h-px flex-1 bg-gradient-to-r from-transparent to-brand-400/35"
        />
        <span
          aria-hidden="true"
          className="grid h-9 w-9 place-items-center rounded-full border border-brand-400/25 bg-brand-500/8 text-brand-300"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
            <path
              d="M12 4 20.5 19.5h-17z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span
          aria-hidden="true"
          className="h-px flex-1 bg-gradient-to-l from-transparent to-brand-400/35"
        />
      </div>

      <p className="text-center">
        <span className="block font-display text-sm font-bold uppercase tracking-widest text-ink-muted">
          {t("feed.end")}
        </span>
        <span className="mt-1 block text-xs text-ink-faint">{t("feed.end.hint")}</span>
      </p>
    </div>
  );
}
