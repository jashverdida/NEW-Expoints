import { NextResponse, type NextRequest } from "next/server";
import { getFeed, PAGE_SIZE } from "@/lib/queries";
import type { FeedSort } from "@/lib/types";

/**
 * JSON feed endpoint.
 *
 * Exists so switching sort tabs or paging is a plain `fetch` that swaps data in
 * place, instead of a full route navigation that re-renders the entire page
 * tree on the server before anything changes on screen.
 *
 * It reuses the exact same `getFeed` used by the server component, so there's
 * one query implementation — no risk of the two paths drifting apart. RLS still
 * applies because this runs with the caller's session cookies.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const sortParam = searchParams.get("sort");
  const sort: FeedSort = ["hot", "new", "top"].includes(sortParam ?? "")
    ? (sortParam as FeedSort)
    : "hot";

  const page = Math.max(0, Number(searchParams.get("page") ?? 0) || 0);
  const search = searchParams.get("q")?.trim() || undefined;
  const fieldParam = searchParams.get("field");
  const searchField = (["title", "content", "author"].includes(fieldParam ?? "")
    ? fieldParam
    : "title") as "title" | "content" | "author";

  const feed = await getFeed({ sort, page, search, searchField });

  return NextResponse.json(
    { ...feed, pageSize: PAGE_SIZE },
    // Per-user data — never let a shared cache hold on to it.
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
