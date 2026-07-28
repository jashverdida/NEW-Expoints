import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileView } from "@/components/profile/ProfileView";
import { getCurrentProfile, getFeed, getPinnedPosts } from "@/lib/queries";

export const metadata: Metadata = {
  title: "My profile",
  description: "Your EXP, rank, perks and reviews.",
};

export default async function MyProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [feed, pinnedPosts] = await Promise.all([
    getFeed({ authorUsername: profile.username, sort: "new", pageSize: 20 }),
    getPinnedPosts(profile),
  ]);

  return (
    <ProfileView
      profile={profile}
      posts={feed.posts}
      pinnedPosts={pinnedPosts}
      viewer={profile}
      isOwnProfile
    />
  );
}
