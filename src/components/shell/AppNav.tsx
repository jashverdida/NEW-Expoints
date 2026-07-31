import { redirect } from "next/navigation";
import { TopNav } from "@/components/shell/TopNav";
import { GuestNav } from "@/components/shell/GuestNav";
import { MobileTabBar } from "@/components/shell/MobileTabBar";
import { NavDock } from "@/components/shell/NavDock";
import { NavRail } from "@/components/shell/NavRail";
import { WelcomeBack } from "@/components/shell/WelcomeBack";
import { getCurrentProfile, getNotifications, getUnreadCount } from "@/lib/queries";

/**
 * All of the app shell's data fetching, isolated into one async component.
 *
 * WHY THIS IS SEPARATE FROM THE LAYOUT
 * `loading.tsx` creates a Suspense boundary around a layout's *children*, not
 * around the layout itself. When the layout was async and awaited three
 * queries, nothing rendered until they finished — so clicking "Enter forum"
 * left you on the landing page with no feedback, and the page's loading state
 * never got a chance to show.
 *
 * Now the layout is synchronous and returns instantly, and this component
 * streams in behind a skeleton. The page's own loading.tsx renders at the same
 * time, so navigation gives immediate feedback.
 *
 * The nav dock, the nav rail and MobileTabBar live here rather than in the
 * layout because all three are for signed-in users only, and this is where we
 * know. All three are fixed-position, so their position in the DOM doesn't
 * matter.
 *
 * They also sit ABOVE the page in the component tree, which is the point: the
 * nav card has to survive navigation, or clicking "Games" inside it would tear
 * the card off the screen on the way to the page it was pointing at.
 */
export async function AppNav() {
  const profile = await getCurrentProfile();

  // Middleware already blocks banned users; this is a second line of defence.
  if (profile?.is_banned) redirect("/banned");

  if (!profile) return <GuestNav />;

  const [unreadCount, notifications] = await Promise.all([
    getUnreadCount(profile.id),
    getNotifications(profile.id, 12),
  ]);

  return (
    <>
      <TopNav profile={profile} unreadCount={unreadCount} notifications={notifications} />
      <NavDock />
      <NavRail />
      <MobileTabBar />
      {/* Lives here rather than in the layout because it needs the profile,
          and here is where we already have it. It renders nothing at all
          unless the sign-in flag is on the URL. */}
      <WelcomeBack profile={profile} />
    </>
  );
}

/**
 * Placeholder shown while AppNav resolves. Matches the real nav's height
 * exactly so the page below doesn't jump when it swaps in.
 */
export function AppNavSkeleton() {
  return (
    <header className="app-header sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:gap-6">
        <div className="h-7 w-32 animate-pulse rounded-lg bg-white/8" />
        <div className="hidden min-w-0 flex-1 justify-center lg:flex">
          <div className="h-11 w-full max-w-2xl animate-pulse rounded-xl bg-white/5" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-white/6" />
          <div className="hidden h-10 w-10 animate-pulse rounded-xl bg-white/6 lg:block" />
          <div className="h-11 w-11 animate-pulse rounded-full bg-white/8" />
        </div>
      </div>
      {/* Mirrors the mobile search row so the header height matches. */}
      <div className="px-4 pb-3 sm:px-6 lg:hidden">
        <div className="h-11 animate-pulse rounded-xl bg-white/5" />
      </div>
    </header>
  );
}
