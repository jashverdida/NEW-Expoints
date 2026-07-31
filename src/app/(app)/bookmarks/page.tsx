import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PostCard } from "@/components/post/PostCard";
import { EmptyState } from "@/components/feed/EmptyState";
import { SideRailPanel } from "@/components/feed/SideRailPanel";
import { ContentColumn } from "@/components/shell/ContentColumn";
import { PageHero } from "@/components/feed/PageHero";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { getBookmarkedPosts, getCurrentProfile } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Bookmarks",
  description: "Reviews you saved for later.",
};

export default async function BookmarksPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const posts = await getBookmarkedPosts(profile.id);

  const totalStars = posts.reduce((sum, p) => sum + p.star_count, 0);

  return (
    <>
      {/* Warm lamplight and slow dust — a quiet reading room. */}
      <Atmosphere theme="library" />

      <ContentColumn docked={!!profile}>
      <PageHero
        icon={<span aria-hidden="true">🔖</span>}
        title="Your Vault"
        subtitle="Reviews you stashed for later"
        accent="#34d399"
        accentSoft="#a7f3d0"
        stats={[
          { label: "Saved", value: posts.length },
          { label: "Stars On Them", value: totalStars },
        ]}
        className="mb-6"
      />

      {posts.length === 0 ? (
        <EmptyState
          title="No bookmarks yet"
          body="Hit the bookmark icon on any review and it'll show up here, on every device you sign in from."
          action={{ href: "/feed", label: "Browse the feed" }}
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} viewer={profile} />
          ))}
          </div>
        )}
      </ContentColumn>

      {/* Fixed beside the column, streaming in on its own so the page paints
          first and never moves. */}
      <Suspense fallback={null}>
        <SideRailPanel />
      </Suspense>
    </>
  );
}
