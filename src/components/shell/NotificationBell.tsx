"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, MessageSquare, Reply, Shield, Sparkles, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markNotificationsRead } from "@/lib/actions";
import type { AppNotification, NotificationType } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

const ICONS: Record<NotificationType, { icon: React.ElementType; color: string }> = {
  star: { icon: Star, color: "text-exp" },
  comment: { icon: MessageSquare, color: "text-brand-300" },
  reply: { icon: Reply, color: "text-brand-300" },
  level_up: { icon: Sparkles, color: "text-exp" },
  mention: { icon: MessageSquare, color: "text-violet" },
  system: { icon: Shield, color: "text-brand-300" },
  moderation: { icon: Shield, color: "text-danger" },
};

/**
 * Notification bell with a live badge.
 *
 * Subscribes to Postgres changes over Supabase Realtime, so a new star shows up
 * without a refresh or a polling loop. The original had neither — you found out
 * about a reply by reloading the page.
 */
export function NotificationBell({
  userId,
  initialCount,
  initialItems,
}: {
  userId: string;
  initialCount: number;
  initialItems: AppNotification[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initialItems);
  const [unread, setUnread] = useState(initialCount);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const fresh = payload.new as AppNotification;
          setItems((prev) => [fresh, ...prev].slice(0, 20));
          setUnread((n) => n + 1);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markAllRead = async () => {
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await markNotificationsRead();
    router.refresh();
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        aria-expanded={open}
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-ink-muted transition-colors hover:border-brand-400/40 hover:text-ink"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[0.62rem] font-bold text-white ring-2 ring-abyss">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className={cn(
              "popover absolute z-50 mt-2 overflow-hidden rounded-2xl",
              // Full-width sheet on phones, anchored dropdown on desktop.
              "right-0 w-[min(92vw,22rem)]",
            )}
          >
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ink-muted">
                Notifications
              </h2>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-brand-300 transition-colors hover:text-brand-200"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[min(60vh,26rem)] overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-ink-faint">
                  Nothing yet. Go post something.
                </p>
              ) : (
                items.map((n) => {
                  const { icon: Icon, color } = ICONS[n.type] ?? ICONS.system;
                  return (
                    <Link
                      key={n.id}
                      href={n.link ?? "/notifications"}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex gap-3 border-b border-white/5 px-4 py-3 transition-colors last:border-0 hover:bg-white/5",
                        !n.is_read && "bg-brand-500/8",
                      )}
                    >
                      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", color)} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-snug">{n.title}</p>
                        {n.body && (
                          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-ink-muted">
                            {n.body}
                          </p>
                        )}
                        <p className="mt-1 text-[0.68rem] text-ink-faint">{timeAgo(n.created_at)}</p>
                      </div>
                      {!n.is_read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-400" />
                      )}
                    </Link>
                  );
                })
              )}
            </div>

            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-white/8 px-4 py-3 text-center text-sm font-semibold text-brand-300 transition-colors hover:bg-white/5"
            >
              See all
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
