import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Gamepad2, PenSquare } from "lucide-react";
import { PostCard } from "@/components/post/PostCard";
import { EmptyState } from "@/components/feed/EmptyState";
import { getCurrentProfile, getFeed, getGameBySlug } from "@/lib/queries";
import { ratingVerdict } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return { title: "Game not found" };

  return {
    title: game.name,
    description: `${game.post_count} community reviews of ${game.name}${
      game.avg_rating !== null ? `, averaging ${game.avg_rating}/10` : ""
    }.`,
  };
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [game, viewer] = await Promise.all([getGameBySlug(slug), getCurrentProfile()]);
  if (!game) notFound();

  const feed = await getFeed({ gameSlug: slug, sort: "hot", pageSize: 30 });
  const verdict = game.avg_rating !== null ? ratingVerdict(game.avg_rating) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link
        href="/games"
        className="group mb-5 inline-flex items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        All games
      </Link>

      <header className="glass-strong relative overflow-hidden rounded-3xl p-5 sm:p-7">
        {verdict && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl"
            style={{ background: `${verdict.color}33` }}
          />
        )}

        <div className="relative flex flex-wrap items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-400/25">
            <Gamepad2 className="h-6 w-6" />
          </span>

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              {game.name}
            </h1>
            <p className="mt-1 text-sm text-ink-faint">
              {[game.release_year, game.genre].filter(Boolean).join(" · ") || "Community-added"}
            </p>

            {game.platforms.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {game.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="rounded-pill border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[0.65rem] font-semibold text-ink-muted"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            )}
          </div>

          {verdict && game.avg_rating !== null && (
            <div className="flex shrink-0 flex-col items-center gap-1">
              <span
                className="grid h-16 w-16 place-items-center rounded-2xl border-2 font-display text-2xl font-extrabold"
                style={{
                  color: verdict.color,
                  borderColor: `${verdict.color}66`,
                  background: `${verdict.color}14`,
                  boxShadow: `0 0 24px -6px ${verdict.color}99`,
                }}
              >
                {game.avg_rating}
              </span>
              <span
                className="font-display text-[0.62rem] font-bold uppercase tracking-widest"
                style={{ color: verdict.color }}
              >
                {verdict.label}
              </span>
              <span className="text-[0.62rem] text-ink-faint">
                {game.post_count} review{game.post_count === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </div>

        {viewer && (
          <Link
            href="/compose"
            className="btn-primary mt-5 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm"
          >
            <PenSquare className="h-4 w-4" />
            Review {game.name}
          </Link>
        )}
      </header>

      <section className="mt-6">
        <h2 className="rule-label mb-4">Community reviews</h2>

        {feed.posts.length === 0 ? (
          <EmptyState
            title="No reviews yet"
            body={`Nobody has reviewed ${game.name}. Be the first and set the score.`}
            action={{ href: "/compose", label: "Write the first review" }}
          />
        ) : (
          <div className="space-y-4">
            {feed.posts.map((post) => (
              <PostCard key={post.id} post={post} viewer={viewer} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
