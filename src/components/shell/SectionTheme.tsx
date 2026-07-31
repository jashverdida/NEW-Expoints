"use client";

import { usePathname } from "next/navigation";
import { sectionFor } from "@/lib/theme";

/**
 * Publishes the current section so CSS can repaint the app around it.
 *
 * It renders one empty, hidden element whose `data-section` globals.css hangs
 * a whole palette off (`:root:has([data-section="embers"])`). Nothing reads it
 * in JavaScript.
 *
 * WHY IT LIVES IN THE SHELL AND NOT ON THE PAGE
 * Two reasons, and both are about the scrollbar and the loading state.
 *
 * The viewport scrollbar is painted from the root element, so its colours have
 * to be resolvable at `:root`. A class on some div inside the page can't reach
 * it; `:root:has(…)` can, wherever the marker actually sits.
 *
 * And the marker has to survive navigation. Page-level markers vanish the
 * moment a route starts loading — `loading.tsx` replaces the page, the marker
 * goes with it, and the entire app snaps back to blue for as long as the
 * skeleton is up, then lurches into the new colour. Rendered up here off
 * `usePathname()`, the palette changes the instant the URL does, before the new
 * page has fetched anything.
 *
 * Server-rendered too — `usePathname` resolves during SSR — so the first paint
 * of a themed page is already the right colour.
 */
export function SectionTheme() {
  return <div hidden aria-hidden="true" data-section={sectionFor(usePathname())} />;
}
