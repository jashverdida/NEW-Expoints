import { Suspense } from "react";
import { AppNav, AppNavSkeleton } from "@/components/shell/AppNav";
import { DockShell } from "@/components/shell/DockShell";
import { SectionTheme } from "@/components/shell/SectionTheme";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { AmbientGlyphs } from "@/components/ui/Glyphs";
import { NavProgress } from "@/components/ui/NavProgress";
import { ToastProvider } from "@/components/ui/Toast";
import { GuestPromptProvider } from "@/components/auth/GuestPrompt";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";

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
      <ConfirmProvider>
      {/* Slim top-edge loading bar; real byte progress on data fetches. */}
      <Suspense fallback={null}>
        <NavProgress />
      </Suspense>

      {/* Repaints the app in the current section's colours. Renders nothing
          visible — globals.css hangs a palette off the attribute it emits. */}
      <SectionTheme />

      {/* Motif and texture behind every page, at low density so they never
          compete with the content. */}
      <AmbientGlyphs />
      <div className="grain-overlay" aria-hidden="true" />

      {/*
        Carries the saved dock preference into the tree. The only awaited thing
        in this file, and the only one allowed to be: it reads a cookie, not a
        database (see DockShell for why that distinction is the whole ballgame).
      */}
      <DockShell>
        {/* z-10 keeps content above the fixed atmosphere layer at z-0. */}
        <div className="relative z-10 flex min-h-dvh flex-col">
          <Suspense fallback={<AppNavSkeleton />}>
            <AppNav />
          </Suspense>

          {/* No horizontal padding for the docks: they're fixed-position and
              positioned off the same measure the page's column is sized from,
              so they place themselves beside it without the page having to
              reserve a lane.

              Clearing the mobile tab bar is the footer's job now — it's what
              sits at the bottom of the page, so it's what the fixed bar covers. */}
          <main className="flex-1 pb-10">{children}</main>

          <SiteFooter />
        </div>
      </DockShell>
      </ConfirmProvider>
      </GuestPromptProvider>
    </ToastProvider>
  );
}
