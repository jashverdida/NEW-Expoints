"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { PostCard } from "@/components/post/PostCard";
import { SortTabs } from "@/components/feed/SortTabs";
import { EmptyState } from "@/components/feed/EmptyState";
import { fetchWithProgress } from "@/components/ui/NavProgress";
import type { FeedPostWithViewer, FeedSort, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FeedPayload {
  posts: FeedPostWithViewer[];
  hasMore: boolean;
  total: number;
}

interface Props {
  initial: FeedPayload;
  initialSort: FeedSort;
  initialPage: number;
  pageSize: number;
  viewer: Profile | null;
  search?: string;
  searchField: "title" | "content" | "author";
}

const cacheKey = (sort: FeedSort, page: number) => `${sort}:${page}`;

/**
 * Client-side feed controller.
 *
 * WHY THIS EXISTS
 * Sort tabs and pagination used to be <Link>s. Every click was a route
 * navigation: the server re-ran the page, re-rendered the whole tree, and the
 * UI showed the old state the entire time it waited. Functionally that's the
 * same stall the PHP build had — different mechanism, same feel.
 *
 * Now:
 *  - The first page is still server-rendered, so first paint and SEO are
 *    unchanged.
 *  - Every subsequent sort/page change is a `fetch` that swaps data in place.
 *  - Results are cached per (sort, page), so going back to a tab you've already
 *    seen is instant with zero network.
 *  - The other two sorts are prefetched once the browser goes idle, so the
 *    common case — clicking a tab for the first time — is usually instant too.
 *  - The URL is updated with history.pushState rather than router.push, which
 *    keeps links shareable and the back button working WITHOUT asking the
 *    server to re-render.
 */
export function FeedClient({
  initial,
  initialSort,
  initialPage,
  pageSize,
  viewer,
  search,
  searchField,
}: Props) {
  const [sort, setSort] = useState<FeedSort>(initialSort);
  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState<FeedPayload>(initial);
  const [busy, setBusy] = useState(false);

  // Seeded with the server-rendered page so the first tab-back is free.
  const cache = useRef(new Map<string, FeedPayload>([[cacheKey(initialSort, initialPage), initial]]));
  // Lets a slow response from an abandoned request be discarded.
  const requestId = useRef(0);

  const buildQuery = useCallback(
    (nextSort: FeedSort, nextPage: number) => {
      const params = new URLSearchParams();
      params.set("sort", nextSort);
      if (nextPage > 0) params.set("page", String(nextPage));
      if (search) {
        params.set("q", search);
        params.set("field", searchField);
      }
      return params;
    },
    [search, searchField],
  );

  const fetchPayload = useCallback(
    async (
      nextSort: FeedSort,
      nextPage: number,
      // Background warming must not flash the progress bar — the user didn't
      // ask for anything, so nothing should appear to be loading.
      { silent = false }: { silent?: boolean } = {},
    ): Promise<FeedPayload | null> => {
      try {
        const url = `/api/feed?${buildQuery(nextSort, nextPage)}`;
        // Streams the body and reports true byte progress to the top bar.
        const res = silent
          ? await fetch(url, { headers: { accept: "application/json" } })
          : await fetchWithProgress(url, { headers: { accept: "application/json" } });
        if (!res.ok) return null;
        const json = (await res.json()) as FeedPayload;
        cache.current.set(cacheKey(nextSort, nextPage), json);
        return json;
      } catch {
        // Offline or aborted — keep showing what's already on screen.
        return null;
      }
    },
    [buildQuery],
  );

  const go = useCallback(
    async (nextSort: FeedSort, nextPage: number) => {
      if (nextSort === sort && nextPage === page) return;

      const id = ++requestId.current;
      setSort(nextSort);
      setPage(nextPage);

      // Keep the URL honest without triggering a server navigation.
      const qs = buildQuery(nextSort, nextPage).toString();
      window.history.pushState(null, "", qs ? `/feed?${qs}` : "/feed");

      const cached = cache.current.get(cacheKey(nextSort, nextPage));
      if (cached) {
        setData(cached);
        setBusy(false);
        if (nextPage !== page) window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setBusy(true);
      const fresh = await fetchPayload(nextSort, nextPage);
      // A newer click landed while this was in flight — drop the stale result.
      if (id !== requestId.current) return;

      if (fresh) {
        setData(fresh);
        if (nextPage !== page) window.scrollTo({ top: 0, behavior: "smooth" });
      }
      setBusy(false);
    },
    [sort, page, buildQuery, fetchPayload],
  );

  /* Warm the other two sorts once the browser is idle, so the first click on
     each is instant. Cheap: three small JSON payloads, fetched off the critical
     path and never blocking interaction. */
  useEffect(() => {
    if (search) return; // search results aren't worth speculatively caching

    const warm = () => {
      (["hot", "new", "top"] as FeedSort[])
        .filter((s) => !cache.current.has(cacheKey(s, 0)))
        .forEach((s) => void fetchPayload(s, 0, { silent: true }));
    };

    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    if (typeof w.requestIdleCallback === "function") {
      const handle = w.requestIdleCallback(warm, { timeout: 2500 });
      return () => (window as unknown as { cancelIdleCallback?: (h: number) => void })
        .cancelIdleCallback?.(handle);
    }
    const t = setTimeout(warm, 1200);
    return () => clearTimeout(t);
  }, [search, fetchPayload]);

  /* Keep browser back/forward working. Because we navigate with pushState, the
     popstate event is ours to handle — read the URL back and restore state from
     cache (or refetch). */
  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      const s = (params.get("sort") ?? "hot") as FeedSort;
      const p = Math.max(0, Number(params.get("page") ?? 0) || 0);

      const cached = cache.current.get(cacheKey(s, p));
      setSort(s);
      setPage(p);
      if (cached) {
        setData(cached);
      } else {
        setBusy(true);
        void fetchPayload(s, p).then((fresh) => {
          if (fresh) setData(fresh);
          setBusy(false);
        });
      }
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [fetchPayload]);

  const lastPage = Math.max(0, Math.ceil(data.total / pageSize) - 1);

  return (
    <div className="space-y-4">
      {!search && <SortTabs active={sort} onChange={(s) => void go(s, 0)} busy={busy} />}

      {data.posts.length === 0 ? (
        search ? (
          <EmptyState
            variant="search"
            title="No reviews matched that"
            body="Try a different term, or switch the filter to search body text or authors instead."
          />
        ) : (
          <EmptyState
            title="The feed is empty"
            body="Nobody has posted a review yet. Be the first — it's worth 10 EXP and instant bragging rights."
            action={{ href: "/compose", label: "Write the first review" }}
          />
        )
      ) : (
        <>
          {/* Only a subtle dim while loading. A skeleton swap here would flash
              and feel slower than it is. */}
          <div
            className={cn(
              "space-y-4 transition-opacity duration-150",
              busy && "pointer-events-none opacity-55",
            )}
          >
            {data.posts.map((post) => (
              <PostCard key={post.id} post={post} viewer={viewer} />
            ))}
          </div>

          {(page > 0 || data.hasMore) && (
            <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={page === 0 || busy}
                onClick={() => void go(sort, page - 1)}
                className={cn(
                  "inline-flex h-11 items-center gap-1.5 rounded-xl px-5 text-sm font-semibold transition-all",
                  page === 0 || busy
                    ? "cursor-not-allowed border border-white/6 bg-white/[0.02] text-ink-faint/50"
                    : "btn-ghost",
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <span className="stat flex items-center gap-2 text-xs text-ink-faint">
                {busy && <Loader2 className="h-3 w-3 animate-spin" />}
                Page {page + 1} of {lastPage + 1}
              </span>

              <button
                type="button"
                disabled={!data.hasMore || busy}
                onClick={() => void go(sort, page + 1)}
                className={cn(
                  "inline-flex h-11 items-center gap-1.5 rounded-xl px-5 text-sm font-semibold transition-all",
                  !data.hasMore || busy
                    ? "cursor-not-allowed border border-white/6 bg-white/[0.02] text-ink-faint/50"
                    : "btn-ghost",
                )}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
