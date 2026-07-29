import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { PostCard } from "@/components/post/PostCard";
import { EmptyState } from "@/components/feed/EmptyState";
import { ToastProvider } from "@/components/ui/Toast";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { GuestPromptProvider } from "@/components/auth/GuestPrompt";
import { Logo } from "@/components/ui/Logo";
import { getCurrentProfile, getFeed } from "@/lib/queries";
import type { FeedSort } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Discover reviews",
  description:
    "Browse community game reviews on EXPoints — no account needed. Sign up to star, comment and earn EXP.",
};

const SORTS: { value: FeedSort; label: string }[] = [
  { value: "hot", label: "Hot" },
  { value: "new", label: "New" },
  { value: "top", label: "Top" },
];

/**
 * The read-only front door for logged-out visitors.
 *
 * Every review renders in full, but starring, saving and commenting all open
 * the signup modal instead of doing anything — see GuestPrompt. Deliberately a
 * separate route from /feed so it can be indexed by search engines.
 */
export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort: rawSort } = await searchParams;
  const sort: FeedSort = SORTS.some((s) => s.value === rawSort)
    ? (rawSort as FeedSort)
    : "hot";

  const [feed, viewer] = await Promise.all([
    getFeed({ sort, pageSize: 20 }),
    getCurrentProfile(),
  ]);

  return (
    <ToastProvider>
      <GuestPromptProvider>
      {/*
        /discover lives outside the (app) route group, so it never inherited
        the shell's background layers — which is why it rendered flat while the
        signed-in feed had the drifting glyphs. Same treatment applied here so
        guests see the real product, not a stripped-down version of it.
      */}
      <Atmosphere theme="glyphs" />
      <div className="grain-overlay" aria-hidden="true" />

      <div className="relative z-10 min-h-dvh">
        <header className="sticky top-0 z-40 border-b border-white/8 bg-abyss/75 backdrop-blur-xl">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
            <Link href="/" aria-label="EXPoints home">
              <Logo className="text-lg sm:text-xl" />
            </Link>

            {viewer ? (
              <Link href="/feed" className="btn-primary inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm">
                Your feed
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="hidden h-10 items-center rounded-xl px-3 text-sm font-semibold text-ink-muted transition-colors hover:text-ink sm:inline-flex"
                >
                  Log in
                </Link>
                <Link href="/register" className="btn-primary inline-flex h-10 items-center rounded-xl px-4 text-sm">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <div className="mb-6">
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              <span className="text-gradient">Discover reviews</span>
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Read anything you like. Sign up to star, comment and start earning EXP.
            </p>
          </div>

          {!viewer && (
            <div className="glass mb-5 flex flex-wrap items-center gap-3 rounded-2xl border-brand-400/25 p-4">
              <Sparkles className="h-5 w-5 shrink-0 text-exp" />
              <p className="min-w-0 flex-1 text-sm text-ink-muted">
                You&apos;re browsing as a guest. Create an account to join the discussion.
              </p>
              <Link href="/register" className="btn-primary inline-flex h-9 items-center rounded-lg px-4 text-xs">
                Sign up free
              </Link>
            </div>
          )}

          <div className="glass mb-5 flex items-center gap-1 rounded-2xl p-1.5">
            {SORTS.map(({ value, label }) => (
              <Link
                key={value}
                href={`/discover?sort=${value}`}
                className={cn(
                  "flex-1 rounded-xl px-3 py-2.5 text-center text-sm font-semibold transition-all",
                  sort === value
                    ? "bg-gradient-to-br from-brand-400 to-brand-600 text-[#041124]"
                    : "text-ink-muted hover:bg-white/5 hover:text-ink",
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          {feed.posts.length === 0 ? (
            <EmptyState
              title="No reviews yet"
              body="The forum is brand new. Sign up and post the first one."
              action={{ href: "/register", label: "Create an account" }}
            />
          ) : (
            <div className="space-y-4">
              {feed.posts.map((post) => (
                <PostCard key={post.id} post={post} viewer={viewer} />
              ))}
            </div>
          )}
        </main>
      </div>
      </GuestPromptProvider>
    </ToastProvider>
  );
}
