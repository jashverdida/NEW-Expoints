/**
 * Which palette a route wears.
 *
 * Every section of EXPoints already has a background of its own — embers on
 * Trending, a night sky on Fresh, a trophy hall on Ranks, lamplight on Saved.
 * The chrome sitting on top of those backgrounds did not follow: cards, the
 * header, the scrollbar and every focus ring stayed the same electric blue, so
 * a red page carried blue panels.
 *
 * This is the switch that fixes it. The section name lands on a `data-section`
 * attribute in the DOM, and globals.css swaps the whole brand colour ramp for
 * that section — which re-themes every surface at once, because Tailwind v4
 * compiles theme colours to `var(--color-brand-400)` rather than to a hex.
 *
 * KEEP IN STEP WITH THE PAGE'S <Atmosphere>
 * The section names match the atmosphere themes on purpose: /popular renders
 * `<Atmosphere theme="embers" />` and appears here as "embers". They're declared
 * separately because they're two different jobs — that one paints the
 * background, this one tints what sits on it — but a page whose two disagreed
 * would look broken, so change them together.
 *
 * Routes not listed keep the default blue. That covers Feed and Games, which
 * are blue sections already, and everything outside the themed set.
 */
export type Section = "default" | "embers" | "starfield" | "gold" | "library" | "obsidian";

const SECTIONS: Record<string, Section> = {
  "/popular": "embers",
  "/newest": "starfield",
  "/leaderboard": "gold",
  "/bookmarks": "library",
  "/settings": "obsidian",
  "/settings/profile": "obsidian",
};

export function sectionFor(pathname: string): Section {
  return SECTIONS[pathname] ?? "default";
}
