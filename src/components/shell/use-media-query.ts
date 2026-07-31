"use client";

import { useEffect, useState } from "react";

/**
 * Reports whether a media query currently matches.
 *
 * Starts `false` on the server and on the first client render, because there is
 * no honest answer before layout — so never drive *rendering* off this or the
 * markup will flash on load. It exists for the things CSS can't express:
 * chiefly whether a breakpoint-hidden element should be removed from the tab
 * order.
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const list = window.matchMedia(query);
    setMatches(list.matches);

    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Tailwind's `xl` — the width at which the dock gutters appear. */
export const DOCK_BREAKPOINT = "(min-width: 80rem)";
