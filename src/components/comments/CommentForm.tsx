"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Send } from "lucide-react";
import { addComment } from "@/lib/actions";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { EXP_REWARDS } from "@/lib/exp";
import type { ActionResult, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

function Submit({ compact }: { compact: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "btn-primary inline-flex shrink-0 items-center gap-2 rounded-xl font-semibold disabled:opacity-70",
        compact ? "h-9 px-4 text-xs" : "h-11 px-5 text-sm",
      )}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      {compact ? "Reply" : `Post · +${EXP_REWARDS.comment_created} EXP`}
    </button>
  );
}

/**
 * Comment / reply composer.
 *
 * `revalidatePath` in the action re-renders the comment tree on the server, so
 * the new comment appears without any client-side list management.
 */
export function CommentForm({
  postId,
  parentId,
  profile,
  autoFocus = false,
  onDone,
}: {
  postId: number;
  parentId?: number;
  profile: Profile;
  autoFocus?: boolean;
  onDone?: () => void;
}) {
  const { push } = useToast();
  const [state, action] = useActionState<ActionResult | null, FormData>(addComment, null);
  const formRef = useRef<HTMLFormElement>(null);
  const isReply = parentId !== undefined;

  /*
   * `onDone` is a fresh closure on every parent render, so including it in the
   * dependency array would re-run this effect constantly and fire a duplicate
   * toast for the same submission. Keep the latest callback in a ref and key
   * the effect on `state` alone.
   */
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const handledRef = useRef<ActionResult | null>(null);

  useEffect(() => {
    if (!state || handledRef.current === state) return;
    handledRef.current = state;

    if (state.ok) {
      formRef.current?.reset();
      push(state.message ?? "Posted.", "success");
      onDoneRef.current?.();
    } else {
      push(state.error, "error");
    }
  }, [state, push]);

  return (
    <form
      ref={formRef}
      action={action}
      className={cn("flex gap-3", isReply ? "items-start" : "items-start")}
    >
      <input type="hidden" name="post_id" value={postId} />
      {isReply && <input type="hidden" name="parent_id" value={parentId} />}

      <Avatar
        username={profile.username}
        avatarUrl={profile.avatar_url}
        level={profile.level}
        size={isReply ? "xs" : "sm"}
        className="mt-1"
      />

      <div className="min-w-0 flex-1 space-y-2.5">
        <textarea
          name="body"
          required
          rows={isReply ? 2 : 3}
          autoFocus={autoFocus}
          maxLength={4000}
          placeholder={isReply ? "Write a reply…" : "Add to the discussion…"}
          className={cn("field resize-y leading-relaxed", isReply && "text-sm")}
        />

        <div className="flex items-center justify-end gap-2">
          {isReply && onDone && (
            <button
              type="button"
              onClick={onDone}
              className="h-9 rounded-xl px-4 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
            >
              Cancel
            </button>
          )}
          <Submit compact={isReply} />
        </div>
      </div>
    </form>
  );
}
