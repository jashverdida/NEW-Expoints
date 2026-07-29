"use client";

import { useTransition } from "react";
import { Star } from "lucide-react";
import { togglePostStar, toggleCommentStar } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import { useGuestPrompt } from "@/components/auth/GuestPrompt";
import {
  interactionKey,
  setStarOverride,
  useStarOverride,
} from "@/components/post/interaction-store";
import { cn, compactNumber } from "@/lib/utils";

/**
 * The star (like) button.
 *
 * Reads from the interaction store first and the server snapshot second, so a
 * star stays lit after the server action resolves. See interaction-store.ts for
 * why `useOptimistic` was the wrong tool here — in short, it discards its value
 * when the transition ends, and on the feed no fresh server data ever arrives
 * to replace it, so the icon snapped back to unstarred.
 *
 * The write is still fire-and-forget from the user's point of view: the icon
 * flips on the next frame, and only a genuine failure rolls it back.
 */
export function StarButton({
  targetId,
  kind = "post",
  starred: serverStarred,
  count: serverCount,
  canInteract,
  size = "md",
  className,
}: {
  targetId: number;
  kind?: "post" | "comment";
  starred: boolean;
  count: number;
  canInteract: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const { push } = useToast();
  const { prompt } = useGuestPrompt();
  const [pending, startTransition] = useTransition();

  const key = interactionKey(kind, targetId);
  const override = useStarOverride(key);

  const starred = override?.starred ?? serverStarred;
  const count = override?.count ?? serverCount;

  const handleClick = () => {
    // Guests get the signup modal and nothing else happens — no optimistic
    // flip, no request. The server action and RLS both reject them anyway,
    // but the UI should never imply the star landed.
    if (!canInteract) {
      prompt("star");
      return;
    }

    const next = { starred: !starred, count: Math.max(0, count + (starred ? -1 : 1)) };
    const rollback = override ?? null;

    // Applied immediately — the store is synchronous, so the icon never waits.
    setStarOverride(key, next);

    startTransition(async () => {
      const result =
        kind === "post"
          ? await togglePostStar(targetId, next.starred)
          : await toggleCommentStar(targetId, next.starred);

      if (!result.ok) {
        setStarOverride(key, rollback);
        push(result.error, "error");
      }
    });
  };

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={starred}
      aria-busy={pending}
      aria-label={starred ? "Remove star" : "Star this"}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1.5 transition-all",
        size === "sm" && "px-2 py-1",
        starred
          ? "border-exp/50 bg-exp/15 text-exp"
          : "border-white/10 bg-white/[0.04] text-ink-muted hover:border-exp/40 hover:bg-exp/10 hover:text-exp",
        className,
      )}
    >
      <Star
        className={cn(
          iconSize,
          "transition-transform group-active:scale-125",
          starred && "fill-current animate-pop",
        )}
      />
      <span className={cn("stat font-bold", size === "sm" ? "text-[0.7rem]" : "text-xs")}>
        {compactNumber(count)}
      </span>
    </button>
  );
}
