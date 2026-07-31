import {
  Bookmark,
  Compass,
  Gamepad2,
  Home,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { TranslationKey } from "@/lib/i18n/en";

/**
 * The canonical primary navigation.
 *
 * The header and the desktop rail each kept their own copy of this list, which
 * is how they drifted apart — the rail said "Home" where the header said
 * "Feed", and neither of them offered Ranks. One list, rendered by the nav card
 * and the rail.
 *
 * The mobile tab bar deliberately does NOT use it: five thumb-sized slots is
 * the practical maximum down there, so it carries its own curated subset.
 *
 * LABELS ARE KEYS, NOT WORDS
 * Every surface that renders this runs the key through `t`. Storing English
 * here and translating at the call site would mean each of those surfaces
 * needing its own mapping, and the first one anybody forgot would sit in
 * English inside an otherwise translated column.
 */
export interface NavItem {
  href: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
  /** One-line description, shown in the expanded nav card. */
  hintKey: TranslationKey;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/feed", labelKey: "nav.feed", icon: Home, hintKey: "nav.feed.hint" },
  { href: "/popular", labelKey: "nav.trending", icon: Compass, hintKey: "nav.trending.hint" },
  { href: "/newest", labelKey: "nav.fresh", icon: Sparkles, hintKey: "nav.fresh.hint" },
  { href: "/games", labelKey: "nav.games", icon: Gamepad2, hintKey: "nav.games.hint" },
  { href: "/leaderboard", labelKey: "nav.ranks", icon: Trophy, hintKey: "nav.ranks.hint" },
  { href: "/bookmarks", labelKey: "nav.saved", icon: Bookmark, hintKey: "nav.saved.hint" },
];

/** Nested routes count as active, so /games/elden-ring still lights up Games. */
export function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
