import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Star, Zap } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { getCurrentProfile, getLeaderboard, type LeaderboardScope } from "@/lib/queries";
import { PageHero } from "@/components/feed/PageHero";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { rankForLevel } from "@/lib/exp";
import { cn, compactNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "The highest-ranked players on EXPoints.",
};

const SCOPES: { value: LeaderboardScope; label: string; icon: React.ElementType }[] = [
  { value: "exp", label: "EXP", icon: Zap },
  { value: "stars", label: "Stars", icon: Star },
  { value: "posts", label: "Reviews", icon: MessageSquare },
];

const MEDALS = ["text-exp", "text-slate-300", "text-amber-600"];

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const { scope: rawScope } = await searchParams;
  const scope: LeaderboardScope = SCOPES.some((s) => s.value === rawScope)
    ? (rawScope as LeaderboardScope)
    : "exp";

  const [players, viewer] = await Promise.all([getLeaderboard(scope, 100), getCurrentProfile()]);

  const valueFor = (p: (typeof players)[number]) =>
    scope === "stars" ? p.stars_received : scope === "posts" ? p.post_count : p.exp;

  const myRank = viewer ? players.findIndex((p) => p.id === viewer.id) : -1;

  const topExp = players[0]?.exp ?? 0;
  const highestLevel = players.reduce((max, p) => Math.max(max, p.level), 0);

  return (
    <>
      {/* Trophy-hall light shafts and drifting gold. */}
      <Atmosphere theme="gold" />

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <PageHero
        icon={<span aria-hidden="true">👑</span>}
        title="Hall of Fame"
        subtitle={
          myRank >= 0
            ? `You're sitting at #${myRank + 1}. Climb.`
            : "Post reviews and collect stars to climb"
        }
        accent="#fbbf24"
        accentSoft="#fde68a"
        stats={[
          { label: "Ranked", value: players.length },
          { label: "Top EXP", value: topExp },
          { label: "Peak Level", value: highestLevel },
        ]}
        className="mb-6"
      />

      {/* Scope switcher */}
      <div className="glass mb-5 flex items-center gap-1 rounded-2xl p-1.5">
        {SCOPES.map(({ value, label, icon: Icon }) => (
          <Link
            key={value}
            href={`/leaderboard?scope=${value}`}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
              scope === value
                ? "bg-gradient-to-br from-brand-400 to-brand-600 text-[#041124] shadow-[0_6px_20px_-6px_rgba(56,160,255,0.8)]"
                : "text-ink-muted hover:bg-white/5 hover:text-ink",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>

      {players.length === 0 ? (
        <p className="glass rounded-3xl px-6 py-16 text-center text-sm text-ink-faint">
          Nobody on the board yet. Post a review and claim #1.
        </p>
      ) : (
        <ol className="space-y-2">
          {players.map((player, i) => {
            const rank = rankForLevel(player.level);
            const isMe = viewer?.id === player.id;
            const isPodium = i < 3;

            return (
              <li key={player.id}>
                <Link
                  href={isMe ? "/me" : `/u/${player.username}`}
                  className={cn(
                    "glass card-interactive flex items-center gap-3 rounded-2xl px-3.5 py-3 sm:gap-4 sm:px-5",
                    isMe && "ring-1 ring-brand-400/50",
                  )}
                  style={
                    isPodium
                      ? { background: `linear-gradient(100deg, ${rank.accent}12, rgba(5,11,30,0.65))` }
                      : undefined
                  }
                >
                  <span
                    className={cn(
                      "stat w-7 shrink-0 text-center font-extrabold sm:w-9 sm:text-lg",
                      isPodium ? MEDALS[i] : "text-ink-faint",
                    )}
                  >
                    {i + 1}
                  </span>

                  <Avatar
                    username={player.username}
                    avatarUrl={player.avatar_url}
                    level={player.level}
                    size={isPodium ? "md" : "sm"}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-display text-sm font-bold sm:text-base">
                        {player.display_name || player.username}
                      </span>
                      {isMe && (
                        <span className="rounded-pill bg-brand-500/20 px-2 py-px text-[0.6rem] font-bold uppercase tracking-widest text-brand-300">
                          You
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-ink-faint">@{player.username}</p>
                  </div>

                  <LevelBadge level={player.level} className="hidden sm:inline-flex" />

                  <span className="shrink-0 text-right">
                    <span className="stat block text-base font-extrabold text-exp sm:text-lg">
                      {compactNumber(valueFor(player))}
                    </span>
                    <span className="block text-[0.6rem] uppercase tracking-widest text-ink-faint">
                      {SCOPES.find((s) => s.value === scope)?.label}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
        )}
      </div>
    </>
  );
}
