import Link from "next/link";
import { Settings, Shield } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SearchBar } from "@/components/shell/SearchBar";
import { NotificationBell } from "@/components/shell/NotificationBell";
import { UserMenu } from "@/components/shell/UserMenu";
import type { AppNotification, Profile } from "@/lib/types";

/**
 * The header, reduced to the three things that belong at the top of every page:
 * where you are (the wordmark), what you're looking for (search), and who you
 * are (notifications, settings, account).
 *
 * The Write CTA is gone from here too — the composer trigger sits at the top of
 * the feed already, and two primary buttons for the same action a few hundred
 * pixels apart is one of them too many. Compose stays reachable off the feed
 * via the mobile tab bar's raised Post button.
 *
 * WHAT LEFT AND WHY
 * Feed / Trending / Fresh / Games / Ranks / Saved used to sit between search
 * and the account cluster. Six destinations, a search field and five controls
 * competing for one row meant search got whatever width was left over — about a
 * third of the bar, with the placeholder truncated to "Search a reviev". The
 * destinations now live in the nav card and the rail (see NavDock / NavRail),
 * where they have room for labels and descriptions, and search gets the middle
 * of the header at any width.
 *
 * No longer a client component: with the nav links gone, nothing here needed
 * `usePathname` to work out an active state.
 */
export function TopNav({
  profile,
  unreadCount,
  notifications,
}: {
  profile: Profile;
  unreadCount: number;
  notifications: AppNotification[];
}) {
  return (
    <header className="app-header sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:gap-6">
        <Link href="/feed" aria-label="EXPoints home" className="shrink-0">
          <Logo className="text-lg sm:text-xl" showSpark />
        </Link>

        {/* The whole middle. Capped so it stays a search box rather than
            becoming a banner on ultrawide displays, and centred in the space
            it's given. On mobile it drops to its own row below. */}
        <div className="hidden min-w-0 flex-1 justify-center lg:flex">
          <div className="w-full max-w-2xl">
            <SearchBar />
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {profile.role === "admin" && (
            <Link
              href="/admin"
              aria-label="Admin panel"
              className="hidden h-10 w-10 place-items-center rounded-xl border border-exp/30 bg-exp/10 text-exp transition-colors hover:bg-exp/20 sm:grid"
            >
              <Shield className="h-4 w-4" />
            </Link>
          )}

          <NotificationBell
            userId={profile.id}
            initialCount={unreadCount}
            initialItems={notifications}
          />

          {/* Settings is in the account menu too, but it's the one destination
              people go looking for in a header, so it gets a direct target. */}
          <Link
            href="/settings"
            aria-label="Settings"
            className="hidden h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/4 text-ink-muted transition-colors hover:border-brand-400/40 hover:bg-white/8 hover:text-brand-200 lg:grid"
          >
            <Settings className="h-4 w-4" />
          </Link>

          <UserMenu profile={profile} />
        </div>
      </div>

      {/* Mobile search gets its own full-width row — no cramming. */}
      <div className="px-4 pb-3 sm:px-6 lg:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
