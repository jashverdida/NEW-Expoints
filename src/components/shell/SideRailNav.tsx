"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Compass, Grid3x3, Home, LogOut, Star } from "lucide-react";
import { signOut } from "@/lib/actions";
import { cn } from "@/lib/utils";

/**
 * The slide-in left rail from the original build.
 *
 * Behaviour matches the original: a thin hotspot hugs the left edge, and the
 * rail slides out on hover or keyboard focus. Rebuilt with real <Link>s and a
 * proper <nav> instead of buttons calling window.location, so it prefetches,
 * works with middle-click / open-in-new-tab, and is reachable by keyboard.
 *
 * Desktop only — phones get the bottom tab bar, which is a better fit for
 * thumbs than a hover-triggered rail.
 */
const LINKS = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/bookmarks", label: "Saved", icon: Bookmark },
  { href: "/games", label: "Games", icon: Grid3x3 },
  { href: "/popular", label: "Trending", icon: Compass },
  { href: "/newest", label: "Fresh", icon: Star },
];

export function SideRailNav() {
  const pathname = usePathname();

  return (
    <div className="group/rail fixed left-0 top-1/2 z-30 hidden -translate-y-1/2 lg:block">
      {/* Invisible hover target so the rail can be summoned from the edge. */}
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-4" />

      <nav
        aria-label="Quick navigation"
        className={cn(
          "glass-strong flex flex-col gap-1.5 rounded-r-2xl border-l-0 p-2",
          // Tucked away until hover or keyboard focus lands inside.
          "-translate-x-[calc(100%-0.65rem)] transition-transform duration-300 ease-out",
          "group-hover/rail:translate-x-0 focus-within:translate-x-0",
        )}
      >
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "grid h-11 w-11 place-items-center rounded-xl transition-colors",
                active
                  ? "bg-gradient-to-br from-brand-400 to-brand-600 text-[#041124]"
                  : "text-ink-muted hover:bg-white/8 hover:text-ink",
              )}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}

        <form action={signOut} className="mt-1 border-t border-white/10 pt-1.5">
          <button
            type="submit"
            title="Sign out"
            className="grid h-11 w-11 place-items-center rounded-xl text-danger transition-colors hover:bg-danger/15"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </form>
      </nav>
    </div>
  );
}
