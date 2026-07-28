"use client";

import { useOptimistic, useTransition } from "react";
import { Star } from "lucide-react";
import { togglePostStar, toggleCommentStar } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import { cn, compactNumber } from "@/lib/utils";

/**
 * The star (like) button.
 *
 * This is the clearest single win over the PHP build. There, starring a post
 * was a form POST: full page reload, scroll position lost, a visible pause
 * while Supabase round-tripped. Here `useOptimistic` flips the icon and the
 * count on the very next frame, then reconciles with the server in the
 * background. If the write fails we roll back and say so.
 */
export function StarButton({
  targetId,
  kind = "post",
  starred,
  count,
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
  const [, startTransition] = useTransition();

  const [state, setOptimistic] = useOptimistic(
    { starred, count },
    (_prev, next: { starred: boolean; count: number }) => next,
  );

  const handleClick = () => {
    if (!canInteract) {
      push("Sign in to star reviews.", "info");
      return;
    }

    const next = {
      starred: !state.starred,
      count: state.count + (state.starred ? -1 : 1),
    };

    startTransition(async () => {
      setOptimistic(next);
      const result =
        kind === "post"
          ? await togglePostStar(targetId, next.starred)
          : await toggleCommentStar(targetId, next.starred);

      // On failure React discards the optimistic value automatically when the
      // transition ends; we just explain what happened.
      if (!result.ok) push(result.error, "error");
    });
  };

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={state.starred}
      aria-label={state.starred ? "Remove star" : "Star this"}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1.5 transition-all",
        size === "sm" && "px-2 py-1",
        state.starred
          ? "border-exp/50 bg-exp/15 text-exp"
          : "border-white/10 bg-white/[0.04] text-ink-muted hover:border-exp/40 hover:bg-exp/10 hover:text-exp",
        className,
      )}
    >
      <Star
        className={cn(
          iconSize,
          "transition-transform group-active:scale-125",
          state.starred && "fill-current animate-pop",
        )}
      />
      <span className={cn("stat font-bold", size === "sm" ? "text-[0.7rem]" : "text-xs")}>
        {compactNumber(state.count)}
      </span>
    </button>
  );
}
