"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Flame,
  Gamepad2,
  PanelRightClose,
  PanelRightOpen,
  Trophy,
  Zap,
} from "lucide-react";
import { useDock } from "@/components/shell/DockProvider";
import { DockToggle } from "@/components/shell/DockToggle";
import { dockColumn, dockItem, DOCK_IN, NO_MOTION } from "@/components/shell/dock-motion";
import { Avatar } from "@/components/ui/Avatar";
import { ExpBar } from "@/components/ui/ExpBar";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { DOCK } from "@/lib/dock";
import { nextPerk } from "@/lib/exp";
import type { Game, Profile } from "@/lib/types";
import { useT } from "@/components/shell/PrefsProvider";
import { cn, compactNumber } from "@/lib/utils";

type RailPlayer = Pick<
  Profile,
  "id" | "username" | "display_name" | "avatar_url" | "level" | "exp"
>;

/**
 * The right dock: your progress, the leaderboard and trending games.
 *
 * Collapsible, and deliberately NOT collapsible into a navigation rail the way
 * the left side is — nothing in this column is a destination, so a rail of
 * links would be a lie about what's behind it. What it collapses into is a
 * mirror of the left rail's silhouette holding three "bring it back" buttons.
 * Same shape, same motion, honest about being a different kind of thing.
 *
 * Hidden below xl, where this information lives on dedicated pages reachable
 * from the tab bar — cramming it into a phone column is what made the old
 * dashboard feel cluttered.
 */
export function SideRail({
  profile,
  topPlayers,
  trendingGames,
}: {
  profile: Profile;
  topPlayers: RailPlayer[];
  trendingGames: Game[];
}) {
  const { open, toggle, show } = useDock();
  const reduce = useReducedMotion();
  const t = useT();
  const upcoming = nextPerk(profile.level);

  const column = dockColumn(1);
  const item = dockItem(1);

  return (
    <>
      {/* Cards. pointer-events-none on the gutter so 20rem of empty column
          doesn't sit over the page swallowing clicks. */}
      <div className={cn(DOCK.columnRight, "pointer-events-none hidden xl:block")}>
        <AnimatePresence initial={false}>
          {open.right && (
            <motion.aside
              key="side-rail"
              aria-label="Your stats"
              variants={column}
              initial="hidden"
              animate="shown"
              exit="gone"
              transition={reduce ? NO_MOTION : undefined}
              className="pointer-events-auto space-y-4 pb-4"
            >
              {/* ── Your progress ── */}
              <motion.section variants={item} className="glass rounded-3xl p-5">
                {/* Header mirrors the nav card's, which is where the matching
                    collapse control lives on the other side. */}
                <div className="mb-4 flex items-center gap-2">
                  <Zap className="h-4 w-4 shrink-0 text-exp" />
                  <h2 className="flex-1 font-display text-[0.72rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
                    {t("rail.yourRun")}
                  </h2>
                  <DockToggle
                    label={t("nav.hideStats")}
                    icon={PanelRightClose}
                    onClick={() => toggle("right")}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Avatar
                    username={profile.username}
                    avatarUrl={profile.avatar_url}
                    level={profile.level}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display font-bold">
                      {profile.display_name || profile.username}
                    </p>
                    <p className="truncate text-xs text-ink-faint">@{profile.username}</p>
                    <LevelBadge level={profile.level} showRank className="mt-1.5" />
                  </div>
                </div>

                <div className="mt-4">
                  <ExpBar exp={profile.exp} />
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: t("rail.reviews"), value: profile.post_count },
                    { label: t("rail.comments"), value: profile.comment_count },
                    { label: t("rail.stars"), value: profile.stars_received },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-white/[0.04] py-2.5">
                      <dd className="stat text-base font-bold">{compactNumber(s.value)}</dd>
                      <dt className="text-[0.6rem] uppercase tracking-widest text-ink-faint">
                        {s.label}
                      </dt>
                    </div>
                  ))}
                </dl>

                {upcoming && (
                  <div className="mt-4 rounded-2xl border border-brand-400/20 bg-brand-500/8 p-3">
                    <p className="text-[0.65rem] font-bold uppercase tracking-widest text-brand-300">
                      Next unlock · Lv.{upcoming.level}
                    </p>
                    <p className="mt-1 text-sm font-semibold">{upcoming.label}</p>
                    <p className="mt-0.5 text-xs leading-snug text-ink-muted">
                      {upcoming.description}
                    </p>
                  </div>
                )}
              </motion.section>

              {/* ── Leaderboard ── */}
              <motion.section variants={item} className="glass rounded-3xl p-5">
                <h2 className="mb-3.5 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-ink-muted">
                  <Trophy className="h-4 w-4 text-exp" />
                  {t("rail.topPlayers")}
                </h2>

                {topPlayers.length === 0 ? (
                  <p className="py-4 text-center text-sm text-ink-faint">{t("rail.nobodyYet")}</p>
                ) : (
                  <ol className="space-y-1.5">
                    {topPlayers.map((player, i) => (
                      <li key={player.id}>
                        <Link
                          href={`/u/${player.username}`}
                          className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-white/5"
                        >
                          <span
                            className={`stat w-4 shrink-0 text-center text-xs font-bold ${
                              i === 0
                                ? "text-exp"
                                : i === 1
                                  ? "text-slate-300"
                                  : i === 2
                                    ? "text-amber-600"
                                    : "text-ink-faint"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <Avatar
                            username={player.username}
                            avatarUrl={player.avatar_url}
                            level={player.level}
                            size="xs"
                          />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            @{player.username}
                          </span>
                          <span className="stat shrink-0 text-xs font-bold text-exp">
                            {compactNumber(player.exp)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}

                <Link
                  href="/leaderboard"
                  className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-300 transition-colors hover:text-brand-200"
                >
                  {t("rail.fullLeaderboard")}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </motion.section>

              {/* ── Trending games ── */}
              {trendingGames.length > 0 && (
                <motion.section variants={item} className="glass rounded-3xl p-5">
                  <h2 className="mb-3.5 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-ink-muted">
                    <Flame className="h-4 w-4 text-brand-300" />
                    {t("rail.mostReviewed")}
                  </h2>

                  <ul className="space-y-1.5">
                    {trendingGames.map((game) => (
                      <li key={game.id}>
                        <Link
                          href={`/games/${game.slug}`}
                          className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-white/5"
                        >
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500/12 text-brand-300 ring-1 ring-brand-400/20">
                            <Gamepad2 className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{game.name}</span>
                            <span className="block text-[0.68rem] text-ink-faint">
                              {game.post_count} review{game.post_count === 1 ? "" : "s"}
                              {game.avg_rating !== null && ` · ${game.avg_rating}/10`}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/games"
                    className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-300 transition-colors hover:text-brand-200"
                  >
                    {t("rail.browseGames")}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </motion.section>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Collapsed twin. */}
      <AnimatePresence initial={false}>
        {!open.right && (
          <motion.div
            key="side-rail-tab"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={reduce ? NO_MOTION : DOCK_IN}
            className="group/tab fixed right-0 top-1/2 z-30 hidden -translate-y-1/2 xl:block"
          >
            <div
              className={cn(
                "glass-strong flex w-16 flex-col gap-1 overflow-hidden rounded-l-3xl border-r-0 p-2.5",
                "transition-[width] duration-400 ease-[var(--ease-out-expo)]",
                "hover:w-56 focus-within:w-56",
              )}
            >
              <button
                type="button"
                onClick={() => toggle("right")}
                className="flex h-11 items-center gap-3 rounded-xl border border-brand-400/25 bg-brand-500/12 px-2.5 text-brand-200 transition-colors duration-200 hover:border-brand-400/50 hover:bg-brand-500/22 hover:text-brand-100"
              >
                <PanelRightOpen className="h-5 w-5 shrink-0" />
                <TabLabel>{t("nav.showCards")}</TabLabel>
              </button>

              <span
                aria-hidden="true"
                className="mx-1 h-px bg-gradient-to-l from-brand-400/35 to-transparent"
              />

              {/*
                Previews of what's folded away. Each one brings the whole column
                back rather than just its own card: three independently
                collapsible cards would be four states to remember and a column
                that's never quite the same shape twice.
              */}
              <TabRow label={t("rail.yourRun")} onClick={() => show("right")}>
                <Avatar
                  username={profile.username}
                  avatarUrl={profile.avatar_url}
                  level={profile.level}
                  size="xs"
                />
              </TabRow>

              <TabRow label={t("rail.topPlayers")} onClick={() => show("right")}>
                <Trophy className="h-5 w-5 text-exp" />
              </TabRow>

              {trendingGames.length > 0 && (
                <TabRow label={t("rail.mostReviewed")} onClick={() => show("right")}>
                  <Flame className="h-5 w-5 text-brand-300" />
                </TabRow>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function TabRow({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Show ${label.toLowerCase()}`}
      className="flex h-11 items-center gap-3 rounded-xl px-2.5 text-ink-muted transition-colors duration-200 hover:bg-white/8 hover:text-ink"
    >
      <span className="grid h-5 w-5 shrink-0 place-items-center">{children}</span>
      <TabLabel>{label}</TabLabel>
    </button>
  );
}

/** Mirror of the nav rail's label: appears once the tab has room for it. */
function TabLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="whitespace-nowrap text-sm font-semibold opacity-0 transition-opacity duration-200 group-hover/tab:opacity-100 group-hover/tab:delay-100 group-focus-within/tab:opacity-100 group-focus-within/tab:delay-100">
      {children}
    </span>
  );
}
