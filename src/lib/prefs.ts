/**
 * Viewer preferences — shared between the server (which reads them) and the
 * client (which writes them).
 *
 * Cookies, not localStorage, and for the same reason the dock state uses them:
 * the server has to know before it renders. A language kept in localStorage
 * would mean every page painting in English first and then flipping, which is
 * worse than not offering the setting at all.
 *
 * Deliberately a plain module with no "use client" — a client module's exports
 * become client references, and the server needs these names too.
 */

export const LOCALES = ["en", "fil", "es"] as const;
export type Locale = (typeof LOCALES)[number];

/** What each language calls itself. Never translated — endonyms never are. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  fil: "Filipino",
  es: "Español",
};

export type MotionPref = "full" | "reduced";
export type EffectsPref = "on" | "off";
export type FeedSortPref = "hot" | "new" | "top";

export interface Prefs {
  locale: Locale;
  motion: MotionPref;
  effects: EffectsPref;
  feedSort: FeedSortPref;
}

export const PREFS_COOKIE = {
  locale: "ex_locale",
  motion: "ex_motion",
  effects: "ex_effects",
  feedSort: "ex_feed_sort",
} as const;

/** A year, matching the dock preference. */
export const PREFS_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const PREFS_DEFAULT: Prefs = {
  locale: "en",
  motion: "full",
  effects: "on",
  feedSort: "hot",
};

/**
 * Turns raw cookie values into a Prefs object, falling back to the default for
 * anything unrecognised.
 *
 * Written against a getter rather than a cookie store so the same parsing runs
 * on the server (next/headers) and in the browser (document.cookie) — one place
 * to be wrong instead of two.
 */
export function parsePrefs(get: (name: string) => string | undefined): Prefs {
  const oneOf = <T extends string>(value: string | undefined, allowed: readonly T[], fallback: T) =>
    allowed.includes(value as T) ? (value as T) : fallback;

  return {
    locale: oneOf(get(PREFS_COOKIE.locale), LOCALES, PREFS_DEFAULT.locale),
    motion: oneOf(get(PREFS_COOKIE.motion), ["full", "reduced"] as const, PREFS_DEFAULT.motion),
    effects: oneOf(get(PREFS_COOKIE.effects), ["on", "off"] as const, PREFS_DEFAULT.effects),
    feedSort: oneOf(
      get(PREFS_COOKIE.feedSort),
      ["hot", "new", "top"] as const,
      PREFS_DEFAULT.feedSort,
    ),
  };
}
