import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Routes that require a signed-in, non-banned account.
 *
 * Deliberately absent: /post, /u, /games, /leaderboard and /discover. Those
 * render for guests so they can be indexed and shared — see the comment in
 * src/app/(app)/layout.tsx.
 */
const PROTECTED_PREFIXES = [
  "/feed",
  "/me",
  "/bookmarks",
  "/notifications",
  "/settings",
  "/compose",
  "/report",
  "/admin",
];

/** Routes a signed-in user should be bounced away from. */
const AUTH_ROUTES = ["/login", "/register"];

/**
 * Refreshes the Supabase session cookie on every request and enforces
 * route-level access. Runs at the edge, so redirects happen before any page
 * work — an unauthenticated hit to /feed never renders.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() revalidates the JWT with Supabase. Do not swap this for
  // getSession(), which trusts whatever cookie the browser sent.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  /*
   * Sub-routes that need auth even though their parent is public. /post/[id] is
   * readable by anyone (it's what search engines index), but /post/[id]/edit is
   * not. Without this the page's own redirect still fires, but only after the
   * shell has streamed — so a signed-out visitor sees a flash of the edit
   * heading before bouncing to /login.
   */
  const PROTECTED_PATTERNS = [/^\/post\/[^/]+\/edit\/?$/];

  const isProtected =
    PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`)) ||
    PROTECTED_PATTERNS.some((re) => re.test(path));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && AUTH_ROUTES.includes(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/feed";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Banned users get one destination and no other.
  if (user && (isProtected || path === "/")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_banned, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.is_banned && path !== "/banned") {
      const url = request.nextUrl.clone();
      url.pathname = "/banned";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (path.startsWith("/admin") && profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/feed";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
