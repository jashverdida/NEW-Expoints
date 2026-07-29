import { Suspense } from "react";
import { AppNav, AppNavSkeleton } from "@/components/shell/AppNav";
import { AmbientGlyphs } from "@/components/ui/Glyphs";
import { NavProgress } from "@/components/ui/NavProgress";
import { ToastProvider } from "@/components/ui/Toast";
import { GuestPromptProvider } from "@/components/auth/GuestPrompt";

/**
 * Shell for the main app.
 *
 * DELIBERATELY SYNCHRONOUS. This function must not await anything.
 *
 * `loading.tsx` creates a Suspense boundary around a layout's children — the
 * layout itself always has to resolve first. When this was async and awaited
 * the profile and notification queries, navigating here rendered nothing at
 * all until they returned, so the browser sat on the previous page and the
 * page-level loading states never appeared.
 *
 * All fetching now lives in <AppNav>, which streams in behind a skeleton while
 * the page's own loading.tsx renders alongside it.
 *
 * Routes in this group split into two kinds:
 *  - Private (/feed, /me, /compose, /settings, /bookmarks, /notifications,
 *    /admin, /report) — middleware redirects anonymous users at the edge.
 *  - Publicly readable (/post/[id], /u/[username], /games, /leaderboard) —
 *    these render for everyone, because they're what search engines index.
 *    AppNav shows the guest nav for those.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <GuestPromptProvider>
      {/* Slim top-edge loading bar; real byte progress on data fetches. */}
      <Suspense fallback={null}>
        <NavProgress />
      </Suspense>

      {/* Motif and texture behind every page, at low density so they never
          compete with the content. */}
      <AmbientGlyphs />
      <div className="grain-overlay" aria-hidden="true" />

      {/* z-10 keeps content above the fixed atmosphere layer at z-0. */}
      <div className="relative z-10 flex min-h-dvh flex-col">
        <Suspense fallback={<AppNavSkeleton />}>
          <AppNav />
        </Suspense>

        {/* Bottom padding clears the mobile tab bar so content is never hidden
            behind it; removed once the tab bar disappears at lg. */}
        <main className="flex-1 pb-24 lg:pb-10">{children}</main>
      </div>
      </GuestPromptProvider>
    </ToastProvider>
  );
}
