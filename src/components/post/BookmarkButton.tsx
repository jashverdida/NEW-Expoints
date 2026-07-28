"use client";

import { useOptimistic, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { toggleBookmark } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export function BookmarkButton({
  postId,
  bookmarked,
  canInteract,
  className,
}: {
  postId: number;
  bookmarked: boolean;
  canInteract: boolean;
  className?: string;
}) {
  const { push } = useToast();
  const [, startTransition] = useTransition();
  const [saved, setSaved] = useOptimistic(bookmarked, (_p, next: boolean) => next);

  const handleClick = () => {
    if (!canInteract) {
      push("Sign in to save reviews.", "info");
      return;
    }

    const next = !saved;
    startTransition(async () => {
      setSaved(next);
      const result = await toggleBookmark(postId, next);
      if (!result.ok) push(result.error, "error");
      else push(next ? "Saved to your bookmarks." : "Removed from bookmarks.", "success");
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? "Remove bookmark" : "Save for later"}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-lg border transition-all",
        saved
          ? "border-brand-400/50 bg-brand-500/15 text-brand-300"
          : "border-white/10 bg-white/[0.04] text-ink-faint hover:border-brand-400/40 hover:text-brand-300",
        className,
      )}
    >
      <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
    </button>
  );
}
