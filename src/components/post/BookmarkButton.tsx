"use client";

import { useTransition } from "react";
import { Bookmark } from "lucide-react";
import { toggleBookmark } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import { useGuestPrompt } from "@/components/auth/GuestPrompt";
import {
  interactionKey,
  setBookmarkOverride,
  useBookmarkOverride,
} from "@/components/post/interaction-store";
import { cn } from "@/lib/utils";

/**
 * Save-for-later toggle.
 *
 * Same fix as StarButton: state comes from the interaction store first and the
 * server snapshot second, so the icon stays filled once the action resolves.
 * See interaction-store.ts for the full diagnosis.
 */
export function BookmarkButton({
  postId,
  bookmarked: serverBookmarked,
  canInteract,
  className,
}: {
  postId: number;
  bookmarked: boolean;
  canInteract: boolean;
  className?: string;
}) {
  const { push } = useToast();
  const { prompt } = useGuestPrompt();
  const [pending, startTransition] = useTransition();

  const key = interactionKey("post", postId);
  const override = useBookmarkOverride(key);
  const saved = override ?? serverBookmarked;

  const handleClick = () => {
    // Guests get the signup modal; nothing is written and nothing flips.
    if (!canInteract) {
      prompt("bookmark");
      return;
    }

    const next = !saved;
    const rollback = override ?? null;

    setBookmarkOverride(key, next);

    startTransition(async () => {
      const result = await toggleBookmark(postId, next);
      if (!result.ok) {
        setBookmarkOverride(key, rollback);
        push(result.error, "error");
      } else {
        push(next ? "Saved to your bookmarks." : "Removed from bookmarks.", "success");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-busy={pending}
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
