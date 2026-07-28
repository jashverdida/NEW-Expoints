"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Compass, Home, PenSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Five slots is the practical maximum for a thumb-reachable bar. Trending and
 * Fresh were unreachable on phones entirely — they now sit here, and Games
 * moves to the top nav and the desktop rail, since browsing a catalogue is a
 * less frequent action than checking what's hot.
 */
const TABS = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/popular", label: "Trending", icon: Compass },
  { href: "/compose", label: "Post", icon: PenSquare, primary: true },
  { href: "/newest", label: "Fresh", icon: Sparkles },
  { href: "/bookmarks", label: "Saved", icon: Bookmark },
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

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-abyss/85 backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-safe pt-1.5">
        {TABS.map(({ href, label, icon: Icon, primary }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);

          if (primary) {
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-label="Write a review"
                  className="mx-auto -mt-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-[#041124] shadow-[0_10px_28px_-6px_rgba(56,160,255,0.85)] transition-transform active:scale-95"
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
                <span className="text-[0.62rem] font-semibold tracking-wide">{label}</span>
                {active && <span className="h-0.5 w-5 rounded-full bg-brand-400" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
