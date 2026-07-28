import type { Metadata } from "next";
import Link from "next/link";
import { Gamepad2, Search, Star } from "lucide-react";
import { getGames } from "@/lib/queries";
import { EmptyState } from "@/components/feed/EmptyState";
import { PageHero } from "@/components/feed/PageHero";
import { ratingVerdict } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Games",
  description: "Browse every game reviewed on EXPoints.",
};

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const games = await getGames(q);

  const totalReviews = games.reduce((sum, g) => sum + g.post_count, 0);
  const rated = games.filter((g) => g.avg_rating !== null);
  const avgScore =
    rated.length > 0
      ? Math.round((rated.reduce((s, g) => s + (g.avg_rating ?? 0), 0) / rated.length) * 10)
      : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <PageHero
        icon={<span aria-hidden="true">🎮</span>}
        title="The Library"
        subtitle="Every game the community has put on trial"
        accent="#38bdf8"
        accentSoft="#a5f3fc"
        stats={[
          { label: "Games", value: games.length },
          { label: "Reviews", value: totalReviews },
          { label: "Avg Score ×10", value: avgScore },
        ]}
      />

      {/* GET form — the query lives in the URL, so results are shareable. */}
      <form action="/games" className="glass relative mb-6 mt-6 rounded-2xl p-1.5">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Find a game…"
          className="field h-11 !border-transparent !bg-transparent !pl-9 focus:!bg-abyss/40"
        />
      </form>

      {games.length === 0 ? (
        <EmptyState
          variant="search"
          title={q ? "No games matched" : "No games yet"}
          body={
            q
              ? "Try a shorter search. If nobody has reviewed it yet, you can add it by writing the first review."
              : "The catalogue fills up as people post reviews."
          }
          action={{ href: "/compose", label: "Write a review" }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => {
            const verdict = game.avg_rating !== null ? ratingVerdict(game.avg_rating) : null;

            return (
              <Link
                key={game.id}
                href={`/games/${game.slug}`}
                className="glass card-interactive flex flex-col rounded-3xl p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-400/25">
                    <Gamepad2 className="h-5 w-5" />
                  </span>

                  {game.avg_rating !== null && verdict && (
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 font-display text-base font-extrabold"
                      style={{
                        color: verdict.color,
                        borderColor: `${verdict.color}55`,
                        background: `${verdict.color}12`,
                      }}
                      title={`Average score: ${game.avg_rating}/10`}
                    >
                      {game.avg_rating}
                    </span>
                  )}
                </div>

                <h2 className="mt-3.5 font-display text-lg font-bold leading-snug">{game.name}</h2>

                <p className="mt-1 text-xs text-ink-faint">
                  {[game.release_year, game.genre].filter(Boolean).join(" · ") || "—"}
                </p>

                {game.platforms.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {game.platforms.slice(0, 3).map((platform) => (
                      <span
                        key={platform}
                        className="rounded-pill border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[0.62rem] font-semibold text-ink-faint"
                      >
                        {platform}
                      </span>
                    ))}
                    {game.platforms.length > 3 && (
                      <span className="px-1 py-0.5 text-[0.62rem] text-ink-faint">
                        +{game.platforms.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <p className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-semibold text-brand-300">
                  <Star className="h-3.5 w-3.5" />
                  {game.post_count} review{game.post_count === 1 ? "" : "s"}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
