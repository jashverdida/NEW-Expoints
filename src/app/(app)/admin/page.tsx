import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Ban,
  EyeOff,
  Flag,
  Gamepad2,
  ImageIcon,
  MessageSquare,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { UserRow } from "@/components/admin/UserRow";
import { ReportRow } from "@/components/admin/ReportRow";
import { PostCard } from "@/components/post/PostCard";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries";
import type { FeedPost, FeedPostWithViewer, Profile, Report } from "@/lib/types";
import { cn, compactNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

type Tab = "users" | "reports" | "hidden" | "images";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  // middleware already gates /admin; this covers direct server-side entry.
  if (profile.role !== "admin") redirect("/feed");

  const { tab: rawTab, q } = await searchParams;
  const tab: Tab = ["users", "reports", "hidden", "images"].includes(rawTab ?? "")
    ? (rawTab as Tab)
    : "users";

  const supabase = await createClient();

  // Counts for the stat band — head:true means no rows cross the wire.
  const [usersCount, postsCount, commentsCount, gamesCount, bannedCount, pendingReports] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("posts").select("id", { count: "exact", head: true }),
      supabase.from("comments").select("id", { count: "exact", head: true }),
      supabase.from("games").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_banned", true),
      supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);

  const stats = [
    { label: "Users", value: usersCount.count ?? 0, icon: Users },
    { label: "Reviews", value: postsCount.count ?? 0, icon: MessageSquare },
    { label: "Comments", value: commentsCount.count ?? 0, icon: MessageSquare },
    { label: "Games", value: gamesCount.count ?? 0, icon: Gamepad2 },
    { label: "Banned", value: bannedCount.count ?? 0, icon: Ban, danger: true },
    { label: "Reports", value: pendingReports.count ?? 0, icon: Flag, danger: true },
  ];

  // Only the active tab's data is fetched.
  let users: Profile[] = [];
  let reports: Report[] = [];
  let hiddenPosts: FeedPostWithViewer[] = [];
  let imagePosts: FeedPostWithViewer[] = [];

  const asViewerPosts = (rows: unknown): FeedPostWithViewer[] =>
    ((rows ?? []) as FeedPost[]).map((p) => ({
      ...p,
      viewer_starred: false,
      viewer_bookmarked: false,
    }));

  if (tab === "images") {
    // Newest first — the point is to catch a bad upload quickly.
    const { data } = await supabase
      .from("post_feed")
      .select("*")
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(40);
    imagePosts = asViewerPosts(data);
  } else if (tab === "users") {
    let query = supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (q?.trim()) query = query.ilike("username", `%${q.trim()}%`);
    const { data } = await query;
    users = (data ?? []) as Profile[];
  } else if (tab === "reports") {
    const { data } = await supabase
      .from("reports")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(60);
    reports = (data ?? []) as Report[];
  } else {
    const { data } = await supabase
      .from("post_feed")
      .select("*")
      .eq("is_hidden", true)
      .order("created_at", { ascending: false })
      .limit(40);
    hiddenPosts = asViewerPosts(data);
  }

  const TABS: { value: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { value: "users", label: "Users", icon: Users },
    { value: "reports", label: "Reports", icon: Flag, badge: pendingReports.count ?? 0 },
    { value: "images", label: "Images", icon: ImageIcon },
    { value: "hidden", label: "Hidden", icon: EyeOff },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <h1 className="flex items-center gap-2.5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          <Shield className="h-7 w-7 text-exp" />
          <span className="text-gradient-exp">Admin</span>
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Signed in as @{profile.username}. Every action here is logged.
        </p>
      </header>

      {/* ── Stats ── */}
      <dl className="mb-6 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
        {stats.map(({ label, value, icon: Icon, danger }) => (
          <div
            key={label}
            className={cn(
              "glass rounded-2xl px-3 py-3.5 text-center",
              danger && value > 0 && "ring-1 ring-danger/30",
            )}
          >
            <Icon
              className={cn(
                "mx-auto mb-1.5 h-4 w-4",
                danger && value > 0 ? "text-danger" : "text-brand-300",
              )}
            />
            <dd
              className={cn(
                "stat text-lg font-extrabold sm:text-xl",
                danger && value > 0 ? "text-danger" : "text-ink",
              )}
            >
              {compactNumber(value)}
            </dd>
            <dt className="mt-0.5 text-[0.58rem] font-semibold uppercase tracking-widest text-ink-faint">
              {label}
            </dt>
          </div>
        ))}
      </dl>

      {/* ── Tabs ── */}
      <div className="glass mb-5 flex items-center gap-1 rounded-2xl p-1.5">
        {TABS.map(({ value, label, icon: Icon, badge }) => (
          <Link
            key={value}
            href={`/admin?tab=${value}`}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
              tab === value
                ? "bg-gradient-to-br from-brand-400 to-brand-600 text-[#041124] shadow-[0_6px_20px_-6px_rgba(56,160,255,0.8)]"
                : "text-ink-muted hover:bg-white/5 hover:text-ink",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {badge !== undefined && badge > 0 && (
              <span
                className={cn(
                  "grid h-5 min-w-5 place-items-center rounded-full px-1 text-[0.6rem] font-bold",
                  tab === value ? "bg-[#041124]/25 text-[#041124]" : "bg-danger text-white",
                )}
              >
                {badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* ── Panels ── */}
      {tab === "users" && (
        <>
          <form action="/admin" className="glass relative mb-4 rounded-2xl p-1.5">
            <input type="hidden" name="tab" value="users" />
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by username…"
              className="field h-11 !border-transparent !bg-transparent !pl-9 focus:!bg-abyss/40"
            />
          </form>

          {users.length === 0 ? (
            <p className="glass rounded-2xl px-6 py-12 text-center text-sm text-ink-faint">
              No users matched.
            </p>
          ) : (
            <ul className="space-y-2">
              {users.map((user) => (
                <UserRow key={user.id} user={user} viewerId={profile.id} />
              ))}
            </ul>
          )}
        </>
      )}

      {tab === "reports" &&
        (reports.length === 0 ? (
          <div className="glass rounded-3xl px-6 py-16 text-center">
            <Flag className="mx-auto mb-3 h-9 w-9 text-ink-faint" />
            <p className="font-display font-bold">Queue is clear</p>
            <p className="mt-1.5 text-sm text-ink-muted">No pending reports.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {reports.map((report) => (
              <ReportRow key={report.id} report={report} />
            ))}
          </ul>
        ))}

      {tab === "images" &&
        (imagePosts.length === 0 ? (
          <div className="glass rounded-3xl px-6 py-16 text-center">
            <ImageIcon className="mx-auto mb-3 h-9 w-9 text-ink-faint" />
            <p className="font-display font-bold">No uploads yet</p>
            <p className="mt-1.5 text-sm text-ink-muted">
              Every review with an attached image lands here for review.
            </p>
          </div>
        ) : (
          <>
            <p className="glass mb-4 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm text-ink-muted">
              <ImageIcon className="h-4 w-4 shrink-0 text-brand-300" />
              Newest uploads first. Use a post&apos;s menu to hide or delete anything that
              shouldn&apos;t be here.
            </p>
            <div className="space-y-4">
              {imagePosts.map((post) => (
                <PostCard key={post.id} post={post} viewer={profile} />
              ))}
            </div>
          </>
        ))}

      {tab === "hidden" &&
        (hiddenPosts.length === 0 ? (
          <div className="glass rounded-3xl px-6 py-16 text-center">
            <EyeOff className="mx-auto mb-3 h-9 w-9 text-ink-faint" />
            <p className="font-display font-bold">Nothing hidden</p>
            <p className="mt-1.5 text-sm text-ink-muted">
              Posts you hide show up here so you can restore them.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {hiddenPosts.map((post) => (
              <PostCard key={post.id} post={post} viewer={profile} />
            ))}
          </div>
        ))}
    </div>
  );
}
