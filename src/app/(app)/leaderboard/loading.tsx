/** Instant skeleton for /leaderboard — see games/loading.tsx for the rationale. */
export default function LeaderboardLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6" aria-busy="true">
      <div className="mb-6 text-center">
        <div className="mx-auto h-14 w-14 animate-pulse rounded-2xl bg-white/8" />
        <div className="mx-auto mt-3 h-9 w-56 animate-pulse rounded-lg bg-white/8" />
        <div className="mx-auto mt-2 h-4 w-64 animate-pulse rounded bg-white/6" />
      </div>

      <div className="glass mb-5 h-14 animate-pulse rounded-2xl" />

      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="glass flex items-center gap-4 rounded-2xl px-5 py-3">
            <div className="h-5 w-6 animate-pulse rounded bg-white/8" />
            <div className="h-9 w-9 animate-pulse rounded-full bg-white/8" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-32 animate-pulse rounded bg-white/8" />
              <div className="h-2.5 w-24 animate-pulse rounded bg-white/6" />
            </div>
            <div className="h-6 w-14 animate-pulse rounded bg-white/6" />
          </div>
        ))}
      </div>
    </div>
  );
}
