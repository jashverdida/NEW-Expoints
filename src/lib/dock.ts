/**
 * Dashboard dock state — shared between the server (which reads the saved
 * preference) and the client (which writes it).
 *
 * Deliberately a plain module rather than part of the client provider: a
 * `"use client"` file's exports are client references, so a server component
 * can't read a constant out of one.
 */

/** The two collapsible columns flanking the feed. */
export type DockSide = "left" | "right";

/** `true` = the column shows its cards; `false` = collapsed to its slim rail. */
export type DockOpenState = Record<DockSide, boolean>;

export const DOCK_COOKIE: Record<DockSide, string> = {
  left: "ex_dock_left",
  right: "ex_dock_right",
};

/** A year. Layout taste isn't something anyone wants to re-set every session. */
export const DOCK_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * What someone with no saved preference gets: both columns showing.
 *
 * Stated outright rather than left as a side effect of how the cookie is read.
 * The check in DockShell could just as reasonably have been written `=== "open"`
 * instead of `!== "closed"` — same code, opposite default, and nothing in the
 * diff would have looked like a behaviour change. The dashboard leads with its
 * cards; hiding them is a choice someone makes, not a state they arrive in.
 */
export const DOCK_DEFAULT: DockOpenState = { left: true, right: true };

/**
 * How wide the content column wants to be, which decides how far out the docks
 * sit beside it.
 *
 *  reading — a column of posts. Capped where excerpt lines stop being
 *            comfortable to scan.
 *  grid    — the game catalogue. A grid of cards has no line length to protect
 *            and looks starved at reading width, so it gets the room it had
 *            before the docks arrived.
 */
export type DockMeasure = "reading" | "grid";

/**
 * Routes laid out with docks.
 *
 * MATCHED EXACTLY, NOT BY PREFIX
 * /games is docked; /games/elden-ring is a public review hub with its own
 * full-width layout, and prefix matching would quietly drag it in.
 *
 * WHAT DECIDES THE RIGHT DOCK
 * Nothing here — the pages that want the stat cards render <SideRailPanel>
 * themselves, so "does this page have a right dock" is answered by whether one
 * is on the page rather than by a second list that has to be kept in sync. All
 * six render it today, which is also what finally fills the empty right gutter
 * the measure reserves (see globals.css).
 *
 * GUESTS
 * Four of these are publicly readable, so being on a docked route does NOT mean
 * there's a signed-in user. The docks themselves are rendered by AppNav, which
 * only runs them for members; the pages pick their column width from whether
 * they have a viewer. Nothing here needs to know, which is what keeps the
 * layout out of the app shell's auth path.
 */
const DOCKED_ROUTES: Record<string, DockMeasure> = {
  "/feed": "reading",
  "/popular": "reading",
  "/newest": "reading",
  "/bookmarks": "reading",
  "/leaderboard": "reading",
  "/games": "grid",
};

export function isDockedRoute(pathname: string) {
  return pathname in DOCKED_ROUTES;
}

export function dockMeasure(pathname: string): DockMeasure | null {
  return DOCKED_ROUTES[pathname] ?? null;
}

/**
 * Geometry, in one place because several components have to agree on it. The
 * offsets themselves live in globals.css, next to a derivation of the numbers.
 */
export const DOCK = {
  columnLeft: "dock-column dock-column-left scrollbar-none",
  columnRight: "dock-column dock-column-right scrollbar-none",
} as const;
