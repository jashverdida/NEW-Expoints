import Link from "next/link";
import { ArrowRight, Flame, Gamepad2, Trophy } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ExpBar } from "@/components/ui/ExpBar";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { nextPerk } from "@/lib/exp";
import type { Game, Profile } from "@/lib/types";
import { compactNumber } from "@/lib/utils";

type RailPlayer = Pick<
  Profile,
  "id" | "username" | "display_name" | "avatar_url" | "level" | "exp"
>;

/**
 * The desktop-only right rail: your progress, the leaderboard and trending
 * games. Hidden below xl, where the same information lives on dedicated pages
 * reachable from the tab bar — cramming it into a phone column is what made the
 * old dashboard feel cluttered.
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
  const upcoming = nextPerk(profile.level);

  return (
    // Width comes from the parent grid track now, so the feed column can stay
    // centred in the viewport.
    <aside className="hidden min-w-0 xl:block">
      <div className="sticky top-24 space-y-4">
        {/* ── Your progress ── */}
        <section className="glass rounded-3xl p-5">
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
              { label: "Reviews", value: profile.post_count },
              { label: "Comments", value: profile.comment_count },
              { label: "Stars", value: profile.stars_received },
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
              <p className="mt-0.5 text-xs leading-snug text-ink-muted">{upcoming.description}</p>
            </div>
          )}
        </section>

        {/* ── Leaderboard ── */}
        <section className="glass rounded-3xl p-5">
          <h2 className="mb-3.5 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-ink-muted">
            <Trophy className="h-4 w-4 text-exp" />
            Top players
          </h2>

          {topPlayers.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink-faint">Nobody yet.</p>
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
            Full leaderboard
            <ArrowRight className="h-3 w-3" />
          </Link>
        </section>

        {/* ── Trending games ── */}
        {trendingGames.length > 0 && (
          <section className="glass rounded-3xl p-5">
            <h2 className="mb-3.5 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-ink-muted">
              <Flame className="h-4 w-4 text-brand-300" />
              Most reviewed
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
              Browse all games
              <ArrowRight className="h-3 w-3" />
            </Link>
          </section>
        )}
      </div>
    </aside>
  );
}
