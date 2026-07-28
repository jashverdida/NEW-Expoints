import { Suspense } from "react";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shell/TopNav";
import { GuestNav } from "@/components/shell/GuestNav";
import { MobileTabBar } from "@/components/shell/MobileTabBar";
import { SideRailNav } from "@/components/shell/SideRailNav";
import { AmbientGlyphs } from "@/components/ui/Glyphs";
import { NavProgress } from "@/components/ui/NavProgress";
import { ToastProvider } from "@/components/ui/Toast";
import { getCurrentProfile, getNotifications, getUnreadCount } from "@/lib/queries";

/**
 * Shell for the main app.
 *
 * Routes in this group split into two kinds:
 *
 *  - Private (/feed, /me, /compose, /settings, /bookmarks, /notifications,
 *    /admin, /report) — middleware redirects anonymous users at the edge before
 *    this ever renders.
 *  - Publicly readable (/post/[id], /u/[username], /games, /leaderboard) — they
 *    render for everyone, because those are the pages search engines index.
 *
 * So a missing profile here is not an error: it means a guest is reading a
 * public page, and they get the guest nav instead of a redirect.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (profile?.is_banned) redirect("/banned");

  if (!profile) {
    return (
      <ToastProvider>
        <AmbientGlyphs />
        <div className="grain-overlay" aria-hidden="true" />
        <div className="relative z-10 flex min-h-dvh flex-col">
          <GuestNav />
          <main className="flex-1 pb-10">{children}</main>
        </div>
      </ToastProvider>
    );
  }

  const [unreadCount, notifications] = await Promise.all([
    getUnreadCount(profile.id),
    getNotifications(profile.id, 12),
  ]);

  return (
    <ToastProvider>
      {/* Slim top-edge loading bar; real byte progress on data fetches. */}
      <Suspense fallback={null}>
        <NavProgress />
      </Suspense>

      {/* Motif and texture behind every signed-in page, at low density so they
          never compete with the content. */}
      <AmbientGlyphs />
      <div className="grain-overlay" aria-hidden="true" />

      {/* z-10 keeps content above the fixed atmosphere layer at z-0. */}
      <div className="relative z-10 flex min-h-dvh flex-col">
        <TopNav profile={profile} unreadCount={unreadCount} notifications={notifications} />

        {/* The original's slide-in edge rail, desktop only. */}
        <SideRailNav />

        {/* Bottom padding clears the mobile tab bar so content is never hidden
            behind it; removed once the tab bar disappears at lg. */}
        <main className="flex-1 pb-24 lg:pb-10">{children}</main>

        <MobileTabBar />
      </div>
    </ToastProvider>
  );
}
