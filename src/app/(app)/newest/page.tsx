import type { Metadata } from "next";
import { Suspense } from "react";
import { PostCard } from "@/components/post/PostCard";
import { PageHero } from "@/components/feed/PageHero";
import { EmptyState } from "@/components/feed/EmptyState";
import { EndOfFeed } from "@/components/feed/EndOfFeed";
import { SideRailPanel } from "@/components/feed/SideRailPanel";
import { ContentColumn } from "@/components/shell/ContentColumn";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getFeed } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Fresh Content",
  description: "The newest game reviews on EXPoints, hot off the press.",
};

/**
 * "Fresh Content" — restored from the original newest.php, violet theme intact.
 *
 * This is a distinct page rather than a sort tab because the themed hero and
 * its live stats were the whole point of it.
 */
export default async function NewestPage() {
  const [profile, feed] = await Promise.all([
    getCurrentProfile(),
    getFeed({ sort: "new", pageSize: 30 }),
  ]);

  // "Posted today" needs its own count — the feed page is capped at 30.
  const supabase = await createClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count: todayCount } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("is_hidden", false)
    .gte("created_at", startOfDay.toISOString());

  return (
    <>
      {/* Night sky across the whole viewport — stars plus the occasional
          shooting star. */}
      <Atmosphere theme="starfield" />

      <ContentColumn docked={!!profile}>
      <PageHero
        icon={<span aria-hidden="true">✨</span>}
        title="Fresh Content"
        subtitle="The latest reviews hot off the press"
        accent="#c084fc"
        accentSoft="#e879f9"
        stats={[
          { label: "New Posts", value: feed.total },
          { label: "Posted Today", value: todayCount ?? 0 },
        ]}
      />

      <div className="mt-6">
        {feed.posts.length === 0 ? (
          <EmptyState
            title="No posts yet"
            body="Be the first to share your thoughts — your review will land right here."
            action={{ href: "/compose", label: "Create post" }}
          />
        ) : (
          <div className="space-y-4">
            {feed.posts.map((post) => (
              <PostCard key={post.id} post={post} viewer={profile} />
            ))}
            <EndOfFeed />
          </div>
        )}
        </div>
      </ContentColumn>

      {/* Fixed beside the column, streaming in on its own so the posts paint
          first and never move. */}
      <Suspense fallback={null}>
        <SideRailPanel />
      </Suspense>
    </>
  );
}
