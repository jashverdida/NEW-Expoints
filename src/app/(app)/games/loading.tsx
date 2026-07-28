/**
 * Instant loading state for /games.
 *
 * Next.js streams this the moment a navigation starts, before the server has
 * finished fetching. Without it the browser sits on the *previous* page while
 * the new one loads, which is what made navigation feel frozen — the click
 * appeared to do nothing for the whole round trip.
 */
export default function GamesLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6" aria-busy="true">
      <div className="mb-6">
        <div className="h-9 w-40 animate-pulse rounded-lg bg-white/8" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-white/6" />
      </div>

      <div className="glass mb-6 h-14 animate-pulse rounded-2xl" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="glass rounded-3xl p-5">
            <div className="flex items-start justify-between">
              <div className="h-11 w-11 animate-pulse rounded-2xl bg-white/8" />
              <div className="h-11 w-11 animate-pulse rounded-2xl bg-white/6" />
            </div>
            <div className="mt-3.5 h-5 w-3/4 animate-pulse rounded bg-white/8" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-white/6" />
            <div className="mt-4 flex gap-1.5">
              <div className="h-5 w-12 animate-pulse rounded-pill bg-white/6" />
              <div className="h-5 w-12 animate-pulse rounded-pill bg-white/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
