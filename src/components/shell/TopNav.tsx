"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Compass, Gamepad2, Home, PenSquare, Shield, Sparkles, Trophy } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SearchBar } from "@/components/shell/SearchBar";
import { NotificationBell } from "@/components/shell/NotificationBell";
import { UserMenu } from "@/components/shell/UserMenu";
import type { AppNotification, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/popular", label: "Trending", icon: Compass },
  { href: "/newest", label: "Fresh", icon: Sparkles },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/leaderboard", label: "Ranks", icon: Trophy },
  { href: "/bookmarks", label: "Saved", icon: Bookmark },
];

export function TopNav({
  profile,
  unreadCount,
  notifications,
}: {
  profile: Profile;
  unreadCount: number;
  notifications: AppNotification[];
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-abyss/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:gap-6">
        <Link href="/feed" aria-label="EXPoints home" className="shrink-0">
          <Logo className="text-lg sm:text-xl" showSpark />
        </Link>

        {/* Search takes the middle on desktop; on mobile it becomes a full row
            below (see MobileSearchRow) so it never squeezes the icons. */}
        <div className="hidden min-w-0 flex-1 lg:block">
          <SearchBar />
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-brand-500/15 text-brand-200"
                    : "text-ink-muted hover:bg-white/5 hover:text-ink",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            href="/compose"
            className="btn-primary hidden h-10 items-center gap-2 rounded-xl px-4 text-sm lg:inline-flex"
          >
            <PenSquare className="h-4 w-4" />
            Write
          </Link>

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
