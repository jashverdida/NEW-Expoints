import Link from "next/link";
import { Gamepad2, Trophy } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

/**
 * Nav shown to logged-out visitors on the publicly readable pages — individual
 * reviews, profiles, game hubs and the leaderboard.
 *
 * Those pages stay open on purpose: they're the ones search engines index, and
 * a review forum that hides its reviews behind a login can't compete with
 * GameFAQs. Anything that writes is still gated in middleware.
 */
export function GuestNav() {
  return (
    <header className="app-header sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3.5 sm:px-6">
        <Link href="/" aria-label="EXPoints home" className="shrink-0">
          <Logo className="text-lg sm:text-xl" />
        </Link>

        <nav className="ml-4 hidden items-center gap-1 sm:flex">
          <Link
            href="/discover"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
          >
            Discover
          </Link>
          <Link
            href="/games"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
          >
            <Gamepad2 className="h-4 w-4" />
            Games
          </Link>
          <Link
            href="/leaderboard"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
          >
            <Trophy className="h-4 w-4" />
            Leaderboard
          </Link>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            href="/login"
            className="hidden h-10 items-center rounded-xl px-3 text-sm font-semibold text-ink-muted transition-colors hover:text-ink sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="btn-primary inline-flex h-10 items-center rounded-xl px-4 text-sm"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
