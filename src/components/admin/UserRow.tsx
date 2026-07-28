"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Ban, Loader2, ShieldCheck, ShieldOff, UserCheck } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { useToast } from "@/components/ui/Toast";
import { setUserBanned, setUserRole } from "@/lib/actions";
import type { Profile } from "@/lib/types";
import { cn, compactNumber, timeAgo } from "@/lib/utils";

/**
 * One row of the user table, with ban/unban and promote/demote.
 *
 * Destructive actions prompt for a reason and confirm before firing — the ban
 * reason is shown to the user on the /banned page, so it can't be an
 * afterthought.
 */
export function UserRow({ user, viewerId }: { user: Profile; viewerId: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"ban" | "role" | null>(null);

  const isSelf = user.id === viewerId;

  const run = (kind: "ban" | "role", fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) => {
    setBusy(kind);
    startTransition(async () => {
      const result = await fn();
      push(
        result.ok ? (result.message ?? "Done.") : (result.error ?? "Something went wrong."),
        result.ok ? "success" : "error",
      );
      setBusy(null);
      if (result.ok) router.refresh();
    });
  };

  const handleBanToggle = () => {
    if (user.is_banned) {
      if (!confirm(`Unban @${user.username}? They'll be able to log in again.`)) return;
      run("ban", () => setUserBanned(user.id, false));
      return;
    }

    const reason = prompt(
      `Ban @${user.username}?\n\nThe reason below is shown to them when they try to log in.`,
      "Violated the community guidelines.",
    );
    if (reason === null) return;
    run("ban", () => setUserBanned(user.id, true, reason.trim() || undefined));
  };

  const handleRoleToggle = () => {
    const nextRole = user.role === "admin" ? "user" : "admin";
    const verb = nextRole === "admin" ? "Promote" : "Demote";
    if (!confirm(`${verb} @${user.username} to ${nextRole}?`)) return;
    run("role", () => setUserRole(user.id, nextRole));
  };

  return (
    <li
      className={cn(
        "glass flex flex-wrap items-center gap-3 rounded-2xl p-3.5 sm:flex-nowrap sm:gap-4 sm:px-5",
        user.is_banned && "opacity-70 ring-1 ring-danger/30",
      )}
    >
      <Link href={`/u/${user.username}`} className="shrink-0">
        <Avatar
          username={user.username}
          avatarUrl={user.avatar_url}
          level={user.level}
          size="md"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/u/${user.username}`}
            className="truncate font-display text-sm font-bold transition-colors hover:text-brand-300"
          >
            {user.display_name || user.username}
          </Link>
          <LevelBadge level={user.level} size="xs" />
          {user.role === "admin" && (
            <span className="rounded-pill border border-exp/50 bg-exp/15 px-2 py-px text-[0.6rem] font-bold uppercase tracking-widest text-exp">
              Admin
            </span>
          )}
          {user.is_banned && (
            <span className="rounded-pill border border-danger/50 bg-danger/15 px-2 py-px text-[0.6rem] font-bold uppercase tracking-widest text-danger">
              Banned
            </span>
          )}
        </div>

        <p className="mt-0.5 truncate text-xs text-ink-faint">
          @{user.username} · joined {timeAgo(user.created_at)}
        </p>

        {user.is_banned && user.ban_reason && (
          <p className="mt-1 line-clamp-1 text-xs text-danger/90" title={user.ban_reason}>
            Reason: {user.ban_reason}
          </p>
        )}
      </div>

      <dl className="hidden shrink-0 gap-4 text-center md:flex">
        {[
          { label: "EXP", value: user.exp },
          { label: "Posts", value: user.post_count },
          { label: "Stars", value: user.stars_received },
        ].map((s) => (
          <div key={s.label}>
            <dd className="stat text-sm font-bold">{compactNumber(s.value)}</dd>
            <dt className="text-[0.58rem] uppercase tracking-widest text-ink-faint">{s.label}</dt>
          </div>
        ))}
      </dl>

      <div className="flex w-full shrink-0 gap-2 sm:w-auto">
        <button
          type="button"
          onClick={handleRoleToggle}
          disabled={pending || isSelf}
          title={isSelf ? "You can't change your own role" : undefined}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-ink-muted transition-colors hover:border-exp/40 hover:text-exp disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
        >
          {busy === "role" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : user.role === "admin" ? (
            <ShieldOff className="h-3.5 w-3.5" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5" />
          )}
          {user.role === "admin" ? "Demote" : "Promote"}
        </button>

        <button
          type="button"
          onClick={handleBanToggle}
          disabled={pending || isSelf || user.role === "admin"}
          title={
            isSelf
              ? "You can't ban yourself"
              : user.role === "admin"
                ? "Demote this admin first"
                : undefined
          }
          className={cn(
            "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none",
            user.is_banned
              ? "border-success/30 bg-success/10 text-success hover:bg-success/20"
              : "border-danger/30 bg-danger/10 text-danger hover:bg-danger/20",
          )}
        >
          {busy === "ban" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : user.is_banned ? (
            <UserCheck className="h-3.5 w-3.5" />
          ) : (
            <Ban className="h-3.5 w-3.5" />
          )}
          {user.is_banned ? "Unban" : "Ban"}
        </button>
      </div>
    </li>
  );
}
