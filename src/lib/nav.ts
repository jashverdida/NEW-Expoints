import {
  Bookmark,
  Compass,
  Gamepad2,
  Home,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";

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
 */
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** One-line description, shown in the expanded nav card. */
  hint: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/feed", label: "Feed", icon: Home, hint: "Everything, hot first" },
  { href: "/popular", label: "Trending", icon: Compass, hint: "Most starred reviews" },
  { href: "/newest", label: "Fresh", icon: Sparkles, hint: "Straight off the press" },
  { href: "/games", label: "Games", icon: Gamepad2, hint: "Browse the catalogue" },
  { href: "/leaderboard", label: "Ranks", icon: Trophy, hint: "Who is climbing" },
  { href: "/bookmarks", label: "Saved", icon: Bookmark, hint: "Your reading list" },
];

/** Nested routes count as active, so /games/elden-ring still lights up Games. */
export function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
