import Link from "next/link";
import { PenSquare, Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ExpBar } from "@/components/ui/ExpBar";
import { EXP_REWARDS, levelProgress, rankForLevel } from "@/lib/exp";
import type { Profile } from "@/lib/types";

/**
 * The "what's on your mind" prompt at the top of the feed.
 *
 * Links to the full /compose page rather than expanding inline. The old version
 * swapped a text input for a long form in place, which pushed the whole feed
 * down and lost your draft on any navigation. A real route means drafts survive
 * a back button and the composer gets room to breathe on mobile.
 */
export function ComposerTrigger({ profile }: { profile: Profile }) {
  const rank = rankForLevel(profile.level);
  const progress = levelProgress(profile.exp);

  return (
    <section
      className="glass-strong relative overflow-hidden rounded-3xl p-4 sm:p-5"
      style={{
        borderColor: `${rank.accent}30`,
        boxShadow: `0 20px 60px -32px ${rank.glow}, inset 0 1px 0 0 rgba(255,255,255,0.07)`,
      }}
    >
      {/* Rank-tinted bloom, so the panel visibly changes as you tier up. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full blur-3xl"
        style={{ background: rank.glow }}
      />

      <div className="relative flex items-center gap-3 sm:gap-4">
        <Avatar
          username={profile.username}
          avatarUrl={profile.avatar_url}
          level={profile.level}
          size="lg"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold sm:text-lg">
            What are you playing,{" "}
            <span style={{ color: rank.accent }}>@{profile.username}</span>?
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[0.72rem] text-ink-faint">
            <Sparkles className="h-3 w-3 text-exp" />
            Drop a review for{" "}
            <span className="stat font-bold text-exp">+{EXP_REWARDS.post_created} EXP</span>
            <span aria-hidden="true">·</span>
            <span className="stat font-bold" style={{ color: rank.accent }}>
              {progress.remaining} EXP
            </span>{" "}
            to Level {progress.level + 1}
          </p>
        </div>

        <Link
          href="/compose"
          className="btn-primary hidden h-11 shrink-0 items-center gap-2 rounded-xl px-5 text-sm sm:inline-flex"
        >
          <PenSquare className="h-4 w-4" />
          Write
        </Link>
        <Link
          href="/compose"
          aria-label="Write a review"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-[#041124] sm:hidden"
        >
          <PenSquare className="h-4 w-4" />
        </Link>
      </div>

      {/* Progress is the point of the product — keep it on screen, always. */}
      <div className="relative mt-4">
        <ExpBar exp={profile.exp} compact showNumbers={false} />
      </div>
    </section>
  );
}
