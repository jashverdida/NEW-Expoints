import type { Metadata } from "next";
import { PostCard } from "@/components/post/PostCard";
import { PageHero } from "@/components/feed/PageHero";
import { EmptyState } from "@/components/feed/EmptyState";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { getCurrentProfile, getFeed } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Trending Now",
  description: "The most-starred game reviews on EXPoints.",
};

/**
 * "Trending Now" — restored from the original popular.php, coral theme intact.
 * Sorted by all-time stars.
 */
export default async function PopularPage() {
  const [profile, feed] = await Promise.all([
    getCurrentProfile(),
    getFeed({ sort: "top", pageSize: 30 }),
  ]);

  // Totals across the page being shown, so the numbers match what's below.
  const totalStars = feed.posts.reduce((sum, p) => sum + p.star_count, 0);
  const totalComments = feed.posts.reduce((sum, p) => sum + p.comment_count, 0);

  return (
    <>
      {/* Heat rising from the bottom of the screen. */}
      <Atmosphere theme="embers" />

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <PageHero
        icon={<span aria-hidden="true">🔥</span>}
        title="Trending Now"
        subtitle="The reviews everyone is starring"
        accent="#ff6b6b"
        accentSoft="#ffa07a"
        stats={[
          { label: "Hot Posts", value: feed.total },
          { label: "Total Stars", value: totalStars },
          { label: "Comments", value: totalComments },
        ]}
      />

      <div className="mt-6">
        {feed.posts.length === 0 ? (
          <EmptyState
            title="Nothing trending yet"
            body="Once reviews start collecting stars, the hottest ones will show up here."
            action={{ href: "/compose", label: "Create post" }}
          />
        ) : (
          <div className="space-y-4">
            {feed.posts.map((post) => (
              <PostCard key={post.id} post={post} viewer={profile} />
            ))}
          </div>
        )}
        </div>
      </div>
    </>
  );
}
