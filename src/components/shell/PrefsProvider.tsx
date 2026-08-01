"use client";

import { createContext, useCallback, useContext, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { makeT, type Translate } from "@/lib/i18n";
import { PREFS_COOKIE, PREFS_COOKIE_MAX_AGE, type Prefs } from "@/lib/prefs";

interface PrefsApi extends Prefs {
  t: Translate;
  /** Writes one preference and re-renders whatever the server owns. */
  set: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void;
  /** True while the server is re-rendering after a change. */
  saving: boolean;
}

const PrefsContext = createContext<PrefsApi | null>(null);

/**
 * Viewer preferences on the client.
 *
 * WHY EVERY CHANGE CALLS router.refresh()
 * Language is the reason. Most of this app renders on the server, so switching
 * to Filipino has to re-run those components — flipping a React state would
 * only repaint the handful of client components and leave the rest in English.
 * Writing the cookie and refreshing re-renders the whole tree from the server
 * with the new dictionary, which is the only way this works without moving
 * every string into the client bundle.
 *
 * Motion and effects don't need the round trip — they're pure CSS hanging off
 * the data attributes below — but they take the same path so there's one
 * behaviour to reason about, and the transition keeps it off the main thread.
 */
export function PrefsProvider({
  initial,
  children,
}: {
  initial: Prefs;
  children: React.ReactNode;
}) {
  const [prefs, setPrefs] = useState(initial);
  const [saving, startTransition] = useTransition();
  const router = useRouter();

  const set = useCallback(
    <K extends keyof Prefs>(key: K, value: Prefs[K]) => {
      setPrefs((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
      document.cookie = `${PREFS_COOKIE[key]}=${value}; path=/; max-age=${PREFS_COOKIE_MAX_AGE}; samesite=lax`;
      startTransition(() => router.refresh());
    },
    [router],
  );

  const api = useMemo<PrefsApi>(
    () => ({ ...prefs, t: makeT(prefs.locale), set, saving }),
    [prefs, set, saving],
  );

  return (
    <PrefsContext.Provider value={api}>
      {/*
        The CSS-driven preferences, published the same way the section palette
        is: an attribute globals.css can hang rules off via :root:has(). Motion
        and effects have to reach things like the scrollbar and the fixed
        atmosphere layers, which no class on a wrapper could ever reach.

        `display: contents` keeps this out of the layout entirely.
      */}
      <div
        className="contents"
        data-motion={prefs.motion}
        data-effects={prefs.effects}
        lang={prefs.locale}
      >
        {children}
      </div>
    </PrefsContext.Provider>
  );
}

/**
 * Throws without a provider, deliberately: everything that reads or writes a
 * preference lives on a settings screen, well inside the shell, and silently
 * handing back defaults there would hide a real wiring mistake.
 */
export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs() must be called inside <PrefsShell>.");
  return ctx;
}

/**
 * Translation, and unlike usePrefs this one does NOT throw.
 *
 * Shared components get rendered outside the app shell — /discover sits in its
 * own route group with no PrefsShell above it, and it renders post cards like
 * everywhere else. A hard throw would turn "this page can't read your language
 * preference", which is cosmetic, into a blank screen, which is not. English is
 * the source dictionary, so the fallback is the real text rather than raw keys.
 */
export function useT(): Translate {
  const ctx = useContext(PrefsContext);
  return ctx?.t ?? FALLBACK_T;
}

const FALLBACK_T = makeT("en");
