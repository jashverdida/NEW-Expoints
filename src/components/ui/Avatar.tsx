import Image from "next/image";
import { rankForLevel } from "@/lib/exp";
import { avatarGradient, cn, initials } from "@/lib/utils";

const SIZES = {
  xs: { box: "h-7 w-7", text: "text-[0.6rem]", ring: 1.5, px: 28 },
  sm: { box: "h-9 w-9", text: "text-xs", ring: 2, px: 36 },
  md: { box: "h-11 w-11", text: "text-sm", ring: 2, px: 44 },
  lg: { box: "h-16 w-16", text: "text-lg", ring: 2.5, px: 64 },
  xl: { box: "h-24 w-24 sm:h-28 sm:w-28", text: "text-3xl", ring: 3, px: 112 },
} as const;

export type AvatarSize = keyof typeof SIZES;

/**
 * User avatar with a rank-coloured ring.
 *
 * The ring colour is derived from level, so someone's tier is readable at a
 * glance anywhere their face appears — feed, comments, leaderboard. Level 20+
 * ("Elite" and above) also gets a soft glow, which is one of the advertised
 * perks of levelling up.
 */
export function Avatar({
  username,
  avatarUrl,
  level = 1,
  size = "md",
  showRing = true,
  className,
}: {
  username: string;
  avatarUrl?: string | null;
  level?: number;
  size?: AvatarSize;
  showRing?: boolean;
  className?: string;
}) {
  const s = SIZES[size];
  const rank = rankForLevel(level);
  const isElite = level >= 20;

  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center rounded-full", s.box, className)}
      style={
        showRing
          ? {
              padding: s.ring,
              background: `linear-gradient(140deg, ${rank.accent}, ${rank.accent}33)`,
              boxShadow: isElite ? `0 0 18px -2px ${rank.glow}` : undefined,
            }
          : undefined
      }
    >
      <span className="relative grid h-full w-full place-items-center overflow-hidden rounded-full bg-void">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={`${username}'s avatar`}
            width={s.px}
            height={s.px}
            className="h-full w-full object-cover"
            unoptimized={avatarUrl.startsWith("data:")}
          />
        ) : (
          <span
            className={cn(
              "grid h-full w-full place-items-center bg-gradient-to-br font-display font-bold text-white",
              avatarGradient(username),
              s.text,
            )}
          >
            {initials(username)}
          </span>
        )}
      </span>
    </span>
  );
}
