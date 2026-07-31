"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronRight, LayoutGrid, PanelLeftClose } from "lucide-react";
import { useDock } from "@/components/shell/DockProvider";
import { DockToggle } from "@/components/shell/DockToggle";
import { dockColumn, dockItem, NO_MOTION } from "@/components/shell/dock-motion";
import { DOCK, isDockedRoute } from "@/lib/dock";
import { PRIMARY_NAV, isNavActive } from "@/lib/nav";
import { cn } from "@/lib/utils";

/**
 * The left dock: primary navigation as a card instead of a row of links buried
 * in the header.
 *
 * The header used to carry Feed / Trending / Fresh / Games / Ranks / Saved AND
 * the search field AND the account cluster, which left the search box squeezed
 * into whatever was left over. Moving the destinations here gives the search
 * bar the whole middle of the header, and gives each destination room for a
 * one-line description — the header had room for a word.
 *
 * Rendered by the app shell rather than by the feed page, so it stays mounted
 * across navigation. That's what lets it animate away properly when you leave
 * the dashboard instead of being torn off the screen mid-transition, and it's
 * what makes the active highlight slide rather than blink.
 *
 * xl and up, on the dashboard only — see isDockedRoute for why the scope is
 * what it is. Everywhere else, and at every narrower width, the same six links
 * live on the always-visible NavRail (lg and up) or the bottom tab bar.
 */
export function NavDock() {
  const pathname = usePathname();
  const { open, toggle } = useDock();
  const reduce = useReducedMotion();

  const column = dockColumn(-1);
  const item = dockItem(-1);

  return (
    // pointer-events-none on the gutter: it spans 20rem of mostly empty space
    // beside the feed, and an invisible column that eats clicks is a bug nobody
    // can see. The card itself opts back in.
    <div className={cn(DOCK.columnLeft, "pointer-events-none hidden xl:block")}>
      <AnimatePresence initial={false}>
        {open.left && isDockedRoute(pathname) && (
          <motion.nav
            key="nav-dock"
            aria-label="Primary"
            variants={column}
            initial="hidden"
            animate="shown"
            exit="gone"
            transition={reduce ? NO_MOTION : undefined}
            className="glass pointer-events-auto relative overflow-hidden rounded-3xl p-3"
          >
            {/* Light catching the top edge of the card. Fades out before the
                corners so it reads as a highlight rather than a border. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/50 to-transparent"
            />

            {/* The house motif, sunk almost all the way into the glass. The
                card is the one surface in the app that's pure chrome — no
                content of its own — so it can afford to carry the mark. */}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinejoin="round"
              className="pointer-events-none absolute -bottom-5 -right-4 h-32 w-32 -rotate-12 text-brand-200/[0.055]"
            >
              <path d="M12 4 20.5 19.5h-17z" />
            </svg>

            <div className="relative mb-2 flex items-center gap-2 px-1.5 pt-0.5">
              {/* gap-2 tightens .rule-label's default 0.75rem — that spacing
                  is tuned for text-only headings, and it reads as a gap rather
                  than a pairing once there's an icon in front. */}
              <h2 className="rule-label min-w-0 flex-1 gap-2">
                <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-brand-300" />
                Browse
              </h2>
              <DockToggle
                label="Hide navigation cards"
                icon={PanelLeftClose}
                onClick={() => toggle("left")}
              />
            </div>

            <ul className="relative space-y-0.5">
              {PRIMARY_NAV.map(({ href, label, icon: Icon, hint }) => {
                const active = isNavActive(pathname, href);

                return (
                  <motion.li key={href} variants={item}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "nav-row group/row relative flex items-center gap-3 rounded-2xl px-2 py-2",
                        "transition-colors duration-200 active:scale-[0.99]",
                        active ? "text-brand-50" : "text-ink-muted hover:text-ink",
                      )}
                    >
                      {/*
                        One shared highlight that slides between rows as you
                        navigate, rather than a background fading in and out on
                        two separate rows. Costs one element and reads as the
                        selection physically moving.

                        The lit spine rides inside it, so it travels as part of
                        the same object — every row is the same height, so the
                        highlight never scales and the spine never distorts.
                      */}
                      {active && (
                        <motion.span
                          layoutId="nav-dock-active"
                          aria-hidden="true"
                          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-500/28 via-brand-500/12 to-transparent ring-1 ring-inset ring-brand-400/25"
                          transition={
                            reduce ? NO_MOTION : { type: "spring", stiffness: 480, damping: 38 }
                          }
                        >
                          <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-gradient-to-b from-brand-200 via-brand-400 to-brand-600 shadow-[0_0_12px_1px_color-mix(in_oklab,var(--color-brand-400)_70%,transparent)]" />
                        </motion.span>
                      )}

                      {/* Sweep, in its own clipping layer so the band can be
                          cropped to the row without also cropping the icon
                          tile's glow. */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
                      >
                        <span className="nav-row-sweep" />
                      </span>

                      <span
                        className={cn(
                          "relative grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset",
                          "transition-[background-color,color,box-shadow,scale] duration-200 group-hover/row:scale-105",
                          active
                            ? "bg-gradient-to-br from-brand-300 to-brand-600 text-ink-on-accent ring-white/30 shadow-[0_8px_20px_-10px_var(--color-brand-400)]"
                            : "bg-gradient-to-br from-white/10 to-white/[0.02] text-ink-faint ring-white/10 group-hover/row:from-brand-400/25 group-hover/row:to-brand-500/5 group-hover/row:text-brand-200 group-hover/row:ring-brand-400/30",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      <span className="relative min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{label}</span>
                        <span
                          className={cn(
                            "block truncate text-[0.68rem] leading-snug transition-colors duration-200",
                            active ? "text-brand-200/70" : "text-ink-faint",
                          )}
                        >
                          {hint}
                        </span>
                      </span>

                      {/* Active rows are bracketed — spine on one side, a lit
                          bead on the other. Everything else gets a chevron that
                          slides in under the pointer, so no row is ever silent
                          about being clickable. */}
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="relative h-1.5 w-1.5 shrink-0 rounded-full bg-brand-300 shadow-[0_0_10px_2px_color-mix(in_oklab,var(--color-brand-300)_60%,transparent)]"
                        />
                      ) : (
                        <ChevronRight
                          aria-hidden="true"
                          className="relative h-4 w-4 shrink-0 -translate-x-1 text-brand-300/70 opacity-0 transition-[translate,opacity] duration-200 group-hover/row:translate-x-0 group-hover/row:opacity-100"
                        />
                      )}
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
