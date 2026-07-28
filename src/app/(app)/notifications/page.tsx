import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, MessageSquare, Reply, Shield, Sparkles, Star } from "lucide-react";
import { getCurrentProfile, getNotifications } from "@/lib/queries";
import { markNotificationsRead } from "@/lib/actions";
import type { NotificationType } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Stars, replies and level-ups.",
};

const ICONS: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
  star: { icon: Star, color: "text-exp", bg: "bg-exp/12 ring-exp/25" },
  comment: { icon: MessageSquare, color: "text-brand-300", bg: "bg-brand-500/12 ring-brand-400/25" },
  reply: { icon: Reply, color: "text-brand-300", bg: "bg-brand-500/12 ring-brand-400/25" },
  level_up: { icon: Sparkles, color: "text-exp", bg: "bg-exp/12 ring-exp/25" },
  mention: { icon: MessageSquare, color: "text-violet", bg: "bg-violet/12 ring-violet/25" },
  system: { icon: Shield, color: "text-brand-300", bg: "bg-brand-500/12 ring-brand-400/25" },
  moderation: { icon: Shield, color: "text-danger", bg: "bg-danger/12 ring-danger/25" },
};

export default async function NotificationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const notifications = await getNotifications(profile.id, 60);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            <Bell className="h-7 w-7 text-brand-300" />
            <span className="text-gradient">Notifications</span>
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up."}
          </p>
        </div>

        {unreadCount > 0 && (
          // Server action bound with no args — marks everything read.
          <form
            action={async () => {
              "use server";
              await markNotificationsRead();
            }}
          >
            <button type="submit" className="btn-ghost h-10 rounded-xl px-4 text-sm">
              Mark all read
            </button>
          </form>
        )}
      </header>

      {notifications.length === 0 ? (
        <div className="glass rounded-3xl px-6 py-16 text-center">
          <Bell className="mx-auto mb-3 h-9 w-9 text-ink-faint" />
          <p className="font-display font-bold">Nothing here yet</p>
          <p className="mt-1.5 text-sm text-ink-muted">
            Stars, comments and level-ups will land here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const { icon: Icon, color, bg } = ICONS[n.type] ?? ICONS.system;

            return (
              <li key={n.id}>
                <Link
                  href={n.link ?? "/feed"}
                  className={cn(
                    "glass card-interactive flex gap-3.5 rounded-2xl p-4",
                    !n.is_read && "ring-1 ring-brand-400/35",
                  )}
                >
                  <span
                    className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1", bg)}
                  >
                    <Icon className={cn("h-4 w-4", color)} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold leading-snug">{n.title}</p>
                    {n.body && (
                      <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-ink-muted">
                        {n.body}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-ink-faint">{timeAgo(n.created_at)}</p>
                  </div>

                  {!n.is_read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-400" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
