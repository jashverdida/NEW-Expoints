import { NextResponse, type NextRequest } from "next/server";
import { getProfileByUsername } from "@/lib/queries";

/**
 * The data behind the hover card on an author's avatar.
 *
 * A separate endpoint rather than more columns on the feed query. A feed page
 * carries twenty posts; adding a banner URL and three counters to every one of
 * them would grow the payload for everybody to serve a card that most readers
 * never open. Hovering is rare and cheap to pay for at the moment it happens.
 *
 * Runs with the caller's session, so row-level security applies exactly as it
 * does everywhere else.
 */
export async function GET(request: NextRequest) {
  const username = new URL(request.url).searchParams.get("username")?.trim();
  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  const profile = await getProfileByUsername(username);
  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  /*
   * Hand-picked fields, not the whole row. The profile record carries the ban
   * reason, who applied it and when — moderation detail that has no business
   * being fetchable from a hover.
   */
  return NextResponse.json({
    username: profile.username,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    banner_url: profile.banner_url,
    bio: profile.bio,
    level: profile.level,
    exp: profile.exp,
    post_count: profile.post_count,
    comment_count: profile.comment_count,
    stars_received: profile.stars_received,
    role: profile.role,
  });
}
