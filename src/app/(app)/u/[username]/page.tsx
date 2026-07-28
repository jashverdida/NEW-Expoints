import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ShieldX } from "lucide-react";
import { ProfileView } from "@/components/profile/ProfileView";
import {
  getCurrentProfile,
  getFeed,
  getPinnedPosts,
  getProfileByUsername,
} from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return { title: "Player not found" };

  return {
    title: `@${profile.username}`,
    description:
      profile.bio ||
      `Level ${profile.level} · ${profile.post_count} reviews · ${profile.stars_received} stars on EXPoints.`,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const [profile, viewer] = await Promise.all([
    getProfileByUsername(username),
    getCurrentProfile(),
  ]);

  if (!profile) notFound();

  // Viewing your own handle redirects to the richer /me view.
  if (viewer?.id === profile.id) redirect("/me");

  // Banned users' profiles stay visible to admins for moderation context.
  if (profile.is_banned && viewer?.role !== "admin") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-danger/12 text-danger ring-1 ring-danger/30">
          <ShieldX className="h-7 w-7" />
        </span>
        <h1 className="font-display text-2xl font-extrabold">This account is suspended</h1>
        <p className="mt-2 text-sm text-ink-muted">
          @{profile.username} was removed from EXPoints for breaking the community guidelines.
        </p>
      </div>
    );
  }

  const [feed, pinnedPosts] = await Promise.all([
    getFeed({ authorUsername: profile.username, sort: "new", pageSize: 20 }),
    getPinnedPosts(profile),
  ]);

  return (
    <ProfileView
      profile={profile}
      posts={feed.posts}
      pinnedPosts={pinnedPosts}
      viewer={viewer}
      isOwnProfile={false}
    />
  );
}
