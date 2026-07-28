/**
 * Loading placeholder for the feed.
 *
 * Matches the real card's geometry so nothing jumps when content arrives —
 * the layout shift on the old dashboard was one of its worst tells.
 */
export function FeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading reviews">
      <div className="glass h-[4.75rem] animate-pulse rounded-3xl" />
      <div className="glass h-[3.75rem] animate-pulse rounded-2xl" />

      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass space-y-4 rounded-3xl p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 animate-pulse rounded-full bg-white/8" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-36 animate-pulse rounded bg-white/8" />
              <div className="h-2.5 w-24 animate-pulse rounded bg-white/6" />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="h-5 w-3/4 animate-pulse rounded bg-white/8" />
            <div className="h-3 w-full animate-pulse rounded bg-white/6" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-white/6" />
          </div>

          <div className="flex gap-2">
            <div className="h-8 w-16 animate-pulse rounded-pill bg-white/6" />
            <div className="h-8 w-16 animate-pulse rounded-pill bg-white/6" />
          </div>
        </div>
      ))}
    </div>
  );
}
