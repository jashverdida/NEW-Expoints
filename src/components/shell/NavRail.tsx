"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { LogOut, PanelLeftOpen } from "lucide-react";
import { useDock } from "@/components/shell/DockProvider";
import { NO_MOTION } from "@/components/shell/dock-motion";
import { DOCK_BREAKPOINT, useMediaQuery } from "@/components/shell/use-media-query";
import { signOut } from "@/lib/actions";
import { isDockedRoute } from "@/lib/dock";
import { PRIMARY_NAV, isNavActive } from "@/lib/nav";
import { useT } from "@/components/shell/PrefsProvider";
import { cn } from "@/lib/utils";

/**
 * The left dock in its collapsed form: a slim icon rail welded to the viewport
 * edge, which widens to show labels while it's hovered or holds focus.
 *
 * WHY IT IS ALWAYS VISIBLE NOW
 * The previous rail parked itself off-screen with 0.65rem peeking out and only
 * slid into view on hover. That's a lovely trick when it's a shortcut layered
 * on top of a header full of links — and a trap once it's the ONLY navigation
 * on the page, which is exactly what collapsing the cards makes it. So it sits
 * out in the open and earns its keep by staying narrow.
 *
 * VISIBILITY IS CSS, NOT MOUNTING
 * The rail covers lg and up; the nav cards only exist at xl and up. So between
 * those two breakpoints the rail has to stay put even when the dock is "open",
 * because there is no dock down there to be open. A media-query-aware `xl:`
 * class expresses that in one place; unmounting on `open.left` could not.
 */
export function NavRail() {
  const pathname = usePathname();
  const { open, toggle } = useDock();
  const reduce = useReducedMotion();
  const t = useT();

  /*
   * Whether the nav card has taken over. Only true where a card actually
   * renders — on a review or a game hub there's no card column, so the rail
   * stays out regardless of the saved preference.
   */
  const superseded = open.left && isDockedRoute(pathname);

  /*
   * The rail is hidden by CSS, which leaves it focusable and in the
   * accessibility tree — two full navigations in the tab order, one of them
   * invisible. `inert` fixes both, but only JS knows whether the `xl:` classes
   * below are actually in force, hence the media query.
   */
  const isWide = useMediaQuery(DOCK_BREAKPOINT);

  return (
    <div
      inert={superseded && isWide}
      className={cn(
        "group/rail fixed left-0 top-1/2 z-30 hidden -translate-y-1/2 lg:block",
        "transition-[translate,opacity] duration-500 ease-[var(--ease-out-expo)]",
        superseded && "xl:pointer-events-none xl:-translate-x-[115%] xl:opacity-0",
      )}
    >
      <nav
        aria-label="Primary"
        className={cn(
          "glass-strong flex w-16 flex-col gap-1 overflow-hidden rounded-r-3xl border-l-0 p-2.5",
          "transition-[width] duration-400 ease-[var(--ease-out-expo)]",
          "hover:w-52 focus-within:w-52",
        )}
      >
        {/*
          Bringing the cards back. Absent below xl and on pages with no card
          column, because a control that visibly does nothing is worse than no
          control at all.
        */}
        {isDockedRoute(pathname) && (
          <>
            <button
              type="button"
              onClick={() => toggle("left")}
              className="hidden h-11 items-center gap-3 rounded-xl border border-brand-400/25 bg-brand-500/12 px-2.5 text-brand-200 transition-colors duration-200 hover:border-brand-400/50 hover:bg-brand-500/22 hover:text-brand-100 xl:flex"
            >
              <PanelLeftOpen className="h-5 w-5 shrink-0" />
              <RailLabel>{t("nav.showCards")}</RailLabel>
            </button>

            <span
              aria-hidden="true"
              className="mx-1 hidden h-px bg-gradient-to-r from-brand-400/35 to-transparent xl:block"
            />
          </>
        )}

        {PRIMARY_NAV.map(({ href, labelKey, icon: Icon }) => {
          const active = isNavActive(pathname, href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-11 items-center gap-3 rounded-xl px-2.5 transition-colors duration-200",
                active ? "text-ink-on-accent" : "text-ink-muted hover:bg-white/8 hover:text-ink",
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-rail-active"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600"
                  transition={
                    reduce ? NO_MOTION : { type: "spring", stiffness: 480, damping: 38 }
                  }
                />
              )}
              <Icon className="relative h-5 w-5 shrink-0" />
              <RailLabel className={active ? "font-bold" : undefined}>{t(labelKey)}</RailLabel>
            </Link>
          );
        })}

        <form action={signOut} className="mt-1 border-t border-white/10 pt-1.5">
          <button
            type="submit"
            className="flex h-11 w-full items-center gap-3 rounded-xl px-2.5 text-danger transition-colors duration-200 hover:bg-danger/15"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <RailLabel>{t("nav.signOut")}</RailLabel>
          </button>
        </form>
      </nav>
    </div>
  );
}

/**
 * A label that only exists once the rail has room for it.
 *
 * `whitespace-nowrap` matters: without it the text wraps to two lines inside
 * the 4rem collapsed rail and pushes the icons out of alignment, even at zero
 * opacity. The delay on fade-in lets the width finish most of its travel first,
 * so text appears in place instead of sliding out from under the icons.
 */
function RailLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative whitespace-nowrap text-sm font-semibold opacity-0 transition-opacity duration-200",
        "group-hover/rail:opacity-100 group-hover/rail:delay-100",
        "group-focus-within/rail:opacity-100 group-focus-within/rail:delay-100",
        className,
      )}
    >
      {children}
    </span>
  );
}
