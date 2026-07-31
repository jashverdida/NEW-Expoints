import type { Metadata } from "next";
import { Suspense } from "react";
import { ComposerTrigger } from "@/components/feed/ComposerTrigger";
import { FeedClient } from "@/components/feed/FeedClient";
import { SideRailPanel } from "@/components/feed/SideRailPanel";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
import { ContentColumn } from "@/components/shell/ContentColumn";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { PAGE_SIZE, getCurrentProfile, getFeed } from "@/lib/queries";
import type { FeedSort } from "@/lib/types";

export const metadata: Metadata = {
  title: "Feed",
  description: "The latest game reviews from the EXPoints community.",
};

interface SearchParams {
  sort?: string;
  page?: string;
  q?: string;
  field?: string;
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const sort: FeedSort = ["hot", "new", "top"].includes(params.sort ?? "")
    ? (params.sort as FeedSort)
    : "hot";
  const page = Math.max(0, Number(params.page ?? 0) || 0);
  const search = params.q?.trim() || undefined;
  const searchField = (params.field as "title" | "content" | "author") ?? "title";

  return (
    <>
      {/* PlayStation glyphs across the whole viewport, not boxed into a panel. */}
      <Atmosphere theme="glyphs" />

      {/*
        Just the post column now.

        This used to be a three-track grid whose left track was an invisible
        spacer, there purely to keep the posts dead-centre in the viewport
        despite the right rail. Both flanks became fixed-position docks that
        place themselves off the column's own measure, so the page went back to
        being one centred column and the grid went away.

        Always `docked` — middleware guarantees a signed-in user on /feed.
      */}
      <ContentColumn docked>
        <Suspense fallback={<FeedSkeleton />}>
          <FeedContent sort={sort} page={page} search={search} searchField={searchField} />
        </Suspense>
      </ContentColumn>

      {/* Fixed beside the column, so it streams in without moving the posts. */}
      <Suspense fallback={null}>
        <SideRailPanel />
      </Suspense>
    </>
  );
}

/** Split out so the rail can stream in independently of the posts. */
async function FeedContent({
  sort,
  page,
  search,
  searchField,
}: {
  sort: FeedSort;
  page: number;
  search?: string;
  searchField: "title" | "content" | "author";
}) {
  const [profile, feed] = await Promise.all([
    getCurrentProfile(),
    getFeed({ sort, page, search, searchField }),
  ]);

  if (!profile) return null;

  return (
    <div className="space-y-4">
      <ComposerTrigger profile={profile} />

      {search && (
        <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
          <p className="text-sm text-ink-muted">
            <span className="stat font-bold text-ink">{feed.total}</span> result
            {feed.total === 1 ? "" : "s"} for{" "}
            <span className="font-semibold text-brand-300">“{search}”</span> in {searchField}
          </p>
          <a
            href="/feed"
            className="text-xs font-semibold text-brand-300 transition-colors hover:text-brand-200"
          >
            Clear search
          </a>
        </div>
      )}

      {/*
        The first page is rendered on the server (fast paint, indexable), then
        handed to a client component that owns every subsequent sort and page
        change. Those become in-place data swaps instead of route navigations.
      */}
      <FeedClient
        initial={{ posts: feed.posts, hasMore: feed.hasMore, total: feed.total }}
        initialSort={sort}
        initialPage={page}
        pageSize={PAGE_SIZE}
        viewer={profile}
        search={search}
        searchField={searchField}
      />
    </div>
  );
}
