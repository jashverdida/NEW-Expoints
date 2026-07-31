"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DOCK_COOKIE,
  DOCK_COOKIE_MAX_AGE,
  dockMeasure,
  type DockOpenState,
  type DockSide,
} from "@/lib/dock";

interface DockApi {
  open: DockOpenState;
  toggle: (side: DockSide) => void;
  show: (side: DockSide) => void;
}

const DockContext = createContext<DockApi | null>(null);

/**
 * Owns whether each flanking column is showing its cards.
 *
 * WHY A COOKIE AND NOT localStorage
 * The preference has to be known during server render. With localStorage the
 * server would always emit "expanded", and anyone who prefers the plain feed
 * would watch the cards flash in and slide out again on every single page load.
 * A cookie is readable in the layout, so the very first paint is already right
 * and `AnimatePresence` starts from the correct state with no entrance.
 */
export function DockProvider({
  initial,
  children,
}: {
  initial: DockOpenState;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(initial);
  const measure = dockMeasure(usePathname());

  /*
   * How much width the docks are actually occupying down the sides.
   *
   * The content column reserves both lanes whether or not a dock is showing, so
   * that toggling one never reflows the page you're reading. The footer is the
   * one place that tradeoff isn't worth paying for: nobody is mid-sentence at
   * the bottom of the page, and holding 43rem empty for two collapsed rails
   * left it a narrow, top-heavy strip in a sea of nothing.
   *
   * So it gets the real figure. An open dock claims its 20rem plus a gap; a
   * collapsed one is a 4rem rail at the very edge and only needs clearing.
   */
  const lane = (side: DockSide) => (open[side] ? 21.5 : 5);
  const dockLanes = measure ? `${lane("left") + lane("right")}rem` : "3rem";

  // Written from an effect rather than inside the state updater so the updater
  // stays pure — it runs twice under StrictMode.
  useEffect(() => {
    for (const side of ["left", "right"] as const) {
      document.cookie = `${DOCK_COOKIE[side]}=${open[side] ? "open" : "closed"}; path=/; max-age=${DOCK_COOKIE_MAX_AGE}; samesite=lax`;
    }
  }, [open]);

  const api = useMemo<DockApi>(
    () => ({
      open,
      toggle: (side) => setOpen((prev) => ({ ...prev, [side]: !prev[side] })),
      show: (side) => setOpen((prev) => (prev[side] ? prev : { ...prev, [side]: true })),
    }),
    [open],
  );

  return (
    <DockContext.Provider value={api}>
      {/*
        Carries --content-measure to everything below it. It has to be an
        ancestor of BOTH the page and the docks — the docks are fixed-position
        siblings of the page, so the page can't set it for them — and
        `display: contents` lets it be that ancestor without putting a box in
        the middle of a carefully balanced layout.
      */}
      <div
        className={measure ? `contents measure-${measure}` : "contents"}
        style={{ "--dock-lanes": dockLanes } as React.CSSProperties}
      >
        {children}
      </div>
    </DockContext.Provider>
  );
}

export function useDock() {
  const ctx = useContext(DockContext);
  if (!ctx) throw new Error("useDock() must be called inside <DockShell>.");
  return ctx;
}
