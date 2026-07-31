"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Compass, Home, PenSquare, Sparkles } from "lucide-react";
import { useT } from "@/components/shell/PrefsProvider";
import { cn } from "@/lib/utils";

/*
 * Five slots is the practical maximum for a thumb-reachable bar. Trending and
 * Fresh were unreachable on phones entirely — they now sit here, and Games
 * moves to the top nav and the desktop rail, since browsing a catalogue is a
 * less frequent action than checking what's hot.
 */
const TABS = [
  { href: "/feed", labelKey: "nav.feed" as const, icon: Home },
  { href: "/popular", labelKey: "nav.trending" as const, icon: Compass },
  { href: "/compose", labelKey: "nav.post" as const, icon: PenSquare, primary: true },
  { href: "/newest", labelKey: "nav.fresh" as const, icon: Sparkles },
  { href: "/bookmarks", labelKey: "nav.saved" as const, icon: Bookmark },
];

/**
 * Bottom tab bar for phones.
 *
 * The old site put everything in one cramped top bar that wrapped into a
 * vertical stack on mobile. This gives thumbs a proper target row, respects the
 * iOS home-indicator inset, and raises the compose button so the primary action
 * is unmissable.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-abyss/85 backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-safe pt-1.5">
        {TABS.map(({ href, labelKey, icon: Icon, primary }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);

          if (primary) {
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-label="Write a review"
                  className="mx-auto -mt-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-ink-on-accent glow-accent-lg transition-transform active:scale-95"
                >
                  <Icon className="h-6 w-6" />
                </Link>
              </li>
            );
          }

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-1 py-2 transition-colors",
                  active ? "text-brand-300" : "text-ink-faint hover:text-ink-muted",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[0.62rem] font-semibold tracking-wide">{t(labelKey)}</span>
                {active && <span className="h-0.5 w-5 rounded-full bg-brand-400" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
