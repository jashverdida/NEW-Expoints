"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, LogOut, Settings, Shield, Trophy, User } from "lucide-react";
import { signOut } from "@/lib/actions";
import { Avatar } from "@/components/ui/Avatar";
import { ExpBar } from "@/components/ui/ExpBar";
import { LevelBadge } from "@/components/ui/LevelBadge";
import type { Profile } from "@/lib/types";
import { cn, compactNumber } from "@/lib/utils";

/**
 * Avatar dropdown. Leads with the EXP bar, because "how close am I to levelling
 * up" is the question this app exists to answer.
 */
export function UserMenu({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const links = [
    { href: "/me", label: "My profile", icon: User },
    { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/settings", label: "Settings", icon: Settings },
    ...(profile.role === "admin"
      ? [{ href: "/admin", label: "Admin panel", icon: Shield }]
      : []),
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className="rounded-full transition-transform hover:scale-105 active:scale-95"
      >
        <Avatar
          username={profile.username}
          avatarUrl={profile.avatar_url}
          level={profile.level}
          size="md"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="glass-strong absolute right-0 z-50 mt-2 w-[min(90vw,19rem)] overflow-hidden rounded-2xl"
          >
            {/* Identity + progress */}
            <div className="border-b border-white/8 p-4">
              <div className="flex items-center gap-3">
                <Avatar
                  username={profile.username}
                  avatarUrl={profile.avatar_url}
                  level={profile.level}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-bold leading-tight">
                    {profile.display_name || profile.username}
                  </p>
                  <p className="truncate text-xs text-ink-faint">@{profile.username}</p>
                </div>
                <LevelBadge level={profile.level} />
              </div>

              <div className="mt-3.5">
                <ExpBar exp={profile.exp} />
              </div>

              <dl className="mt-3.5 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "EXP", value: profile.exp },
                  { label: "Reviews", value: profile.post_count },
                  { label: "Stars", value: profile.stars_received },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-white/[0.04] py-2">
                    <dd className="stat text-sm font-bold text-ink">{compactNumber(s.value)}</dd>
                    <dt className="text-[0.6rem] uppercase tracking-widest text-ink-faint">
                      {s.label}
                    </dt>
                  </div>
                ))}
              </dl>
            </div>

            <nav className="p-1.5">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-white/6 hover:text-ink",
                    href === "/admin" && "text-exp hover:text-exp",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </nav>

            <form action={signOut} className="border-t border-white/8 p-1.5">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
