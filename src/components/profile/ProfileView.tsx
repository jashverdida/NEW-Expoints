import Link from "next/link";
import { CalendarDays, Gamepad2, Lock, Settings, Sparkles, Star, Tag } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ExpBar } from "@/components/ui/ExpBar";
import { AdminBadge, LevelBadge } from "@/components/ui/LevelBadge";
import { PostCard } from "@/components/post/PostCard";
import { ShowcasePicker } from "@/components/profile/ShowcasePicker";
import { EmptyState } from "@/components/feed/EmptyState";
import { PERKS, rankForLevel } from "@/lib/exp";
import type { FeedPostWithViewer, Profile } from "@/lib/types";
import { cn, compactNumber, formatDate } from "@/lib/utils";

/**
 * Profile page body, shared by /me and /u/[username].
 *
 * Leads with the rank banner and EXP bar because progression is the product;
 * the original profile buried level behind a hover tooltip.
 */
export function ProfileView({
  profile,
  posts,
  pinnedPosts,
  viewer,
  isOwnProfile,
}: {
  profile: Profile;
  posts: FeedPostWithViewer[];
  pinnedPosts: FeedPostWithViewer[];
  viewer: Profile | null;
  isOwnProfile: boolean;
}) {
  const rank = rankForLevel(profile.level);

  const stats = [
    { label: "EXP", value: profile.exp, accent: true },
    { label: "Reviews", value: profile.post_count },
    { label: "Comments", value: profile.comment_count },
    { label: "Stars", value: profile.stars_received },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* ── Banner ── */}
      <header className="glass-strong relative overflow-hidden rounded-3xl">
        {/* Uploaded banner if there is one; otherwise a rank-tinted gradient so
            the header still reflects the player's tier. */}
        <div
          aria-hidden="true"
          className="relative h-28 sm:h-44"
          style={
            profile.banner_url
              ? {
                  backgroundImage: `url(${profile.banner_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : {
                  background: `linear-gradient(120deg, ${rank.accent}44, transparent 60%), linear-gradient(200deg, ${rank.accent}22, rgba(5,11,30,0.5))`,
                }
          }
        >
          {profile.banner_url && (
            // Keeps the name and badges readable over any uploaded image.
            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-transparent" />
          )}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
          style={{ background: rank.glow }}
        />

        <div className="relative px-5 pb-6 sm:px-8">
          {/*
            Name sits beside the avatar, but only the AVATAR carries the
            negative margin — that's the whole fix.

            Previously the negative margin was on this row, which lifted the
            name with it and pushed its top over the banner's lower edge. Now
            the row starts at the banner edge and `items-end` bottom-aligns
            both: the avatar's margin box is shortened by the pull, so it
            overhangs upward while the text stays entirely below the banner.
          */}
          <div className="flex items-end gap-4">
            <Avatar
              username={profile.username}
              avatarUrl={profile.avatar_url}
              level={profile.level}
              size="xl"
              className="-mt-12 shrink-0 sm:-mt-14"
            />

            <div className="min-w-0 flex-1 pb-0.5">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <h1 className="font-display text-xl font-extrabold leading-tight tracking-tight sm:text-3xl">
                  {profile.display_name || profile.username}
                </h1>
                <LevelBadge level={profile.level} showRank size="md" />
                {profile.role === "admin" && <AdminBadge />}
              </div>
              <p className="mt-1 truncate text-sm text-ink-faint">@{profile.username}</p>
            </div>

            {isOwnProfile && (
              <Link
                href="/settings"
                className="btn-ghost hidden h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm sm:inline-flex"
              >
                <Settings className="h-4 w-4" />
                Edit profile
              </Link>
            )}
          </div>

          {/* On phones the edit button drops below rather than squeezing the
              name into a narrow column. */}
          {isOwnProfile && (
            <Link
              href="/settings"
              className="btn-ghost mt-4 inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm sm:hidden"
            >
              <Settings className="h-4 w-4" />
              Edit profile
            </Link>
          )}

          {profile.bio && (
            <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-ink-muted">
              {profile.bio}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-faint">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Joined {formatDate(profile.created_at)}
            </span>
            {profile.favorite_game && (
              <span className="inline-flex items-center gap-1.5">
                <Gamepad2 className="h-3.5 w-3.5" />
                {profile.favorite_game}
              </span>
            )}
            {profile.favorite_genre && (
              <span className="inline-flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                {profile.favorite_genre}
              </span>
            )}
          </div>

          {/* ── EXP ── */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-abyss/40 p-4 sm:p-5">
            <ExpBar exp={profile.exp} />
          </div>

          {/* ── Stats ── */}
          <dl className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3.5 text-center"
              >
                <dd
                  className={cn(
                    "stat text-xl font-extrabold sm:text-2xl",
                    s.accent ? "text-exp" : "text-ink",
                  )}
                >
                  {compactNumber(s.value)}
                </dd>
                <dt className="mt-0.5 text-[0.62rem] font-semibold uppercase tracking-widest text-ink-faint">
                  {s.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {/* ── Perks ── */}
      <section className="mt-6">
        <h2 className="rule-label mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          Perks
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {PERKS.map((perk) => {
            const unlocked = profile.level >= perk.level;
            return (
              <div
                key={perk.label}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4 transition-colors",
                  unlocked
                    ? "border-brand-400/25 bg-brand-500/8"
                    : "border-white/8 bg-white/[0.02] opacity-60",
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-bold",
                    unlocked ? "bg-brand-500/20 text-brand-300" : "bg-white/5 text-ink-faint",
                  )}
                >
                  {unlocked ? <Sparkles className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                    {perk.label}
                    <span className="stat text-[0.65rem] font-bold text-ink-faint">
                      Lv.{perk.level}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-ink-muted">{perk.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Showcase ── */}
      {(pinnedPosts.length > 0 || isOwnProfile) && (
        <section className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="rule-label !after:hidden">
              <Star className="h-3.5 w-3.5 text-exp" />
              Best reviews
            </h2>
            {isOwnProfile && (
              <ShowcasePicker
                posts={posts}
                pinned={profile.pinned_post_ids ?? []}
                level={profile.level}
              />
            )}
          </div>

          {pinnedPosts.length > 0 ? (
            <div className="space-y-3">
              {pinnedPosts.map((post) => (
                <PostCard key={post.id} post={post} viewer={viewer} />
              ))}
            </div>
          ) : (
            isOwnProfile &&
            profile.level >= 10 && (
              <p className="glass rounded-2xl px-4 py-6 text-center text-sm text-ink-faint">
                Nothing featured yet. Pick your three best reviews above.
              </p>
            )
          )}
        </section>
      )}

      {/* ── All reviews ── */}
      <section className="mt-6">
        <h2 className="rule-label mb-4">
          {isOwnProfile ? "Your reviews" : `Reviews by @${profile.username}`}
        </h2>

        {posts.length === 0 ? (
          <EmptyState
            title={isOwnProfile ? "You haven't posted yet" : "No reviews yet"}
            body={
              isOwnProfile
                ? "Your first review is worth 10 EXP and gets you off Level 1."
                : "This player hasn't published a review yet."
            }
            action={isOwnProfile ? { href: "/compose", label: "Write your first review" } : undefined}
          />
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} viewer={viewer} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
