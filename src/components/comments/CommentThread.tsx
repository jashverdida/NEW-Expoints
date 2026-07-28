"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, MessageSquare, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { AdminBadge, LevelBadge } from "@/components/ui/LevelBadge";
import { StarButton } from "@/components/post/StarButton";
import { CommentForm } from "@/components/comments/CommentForm";
import { useToast } from "@/components/ui/Toast";
import { deleteComment } from "@/lib/actions";
import type { Comment, Profile } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

/**
 * One comment plus its replies.
 *
 * Replies arrive with the initial page load (getComments fetches the whole tree
 * in one query), so expanding a thread is instant — the old app fired a
 * separate request every time you clicked "View 3 replies".
 */
function CommentNode({
  comment,
  postId,
  viewer,
  depth = 0,
}: {
  comment: Comment;
  postId: number;
  viewer: Profile | null;
  depth?: number;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(depth === 0 && comment.reply_count <= 3);
  const [, startTransition] = useTransition();

  const replies = comment.replies ?? [];
  const canDelete = viewer && (viewer.id === comment.author_id || viewer.role === "admin");

  const handleDelete = () => {
    if (!confirm("Delete this comment?")) return;
    startTransition(async () => {
      const result = await deleteComment(comment.id, postId);
      push(result.ok ? "Comment deleted." : result.error, result.ok ? "success" : "error");
      if (result.ok) router.refresh();
    });
  };

  return (
    <li className={cn(depth > 0 && "ml-4 border-l border-white/8 pl-4 sm:ml-6 sm:pl-5")}>
      <div className="py-3">
        <div className="flex gap-3">
          <Link href={`/u/${comment.author.username}`} className="shrink-0">
            <Avatar
              username={comment.author.username}
              avatarUrl={comment.author.avatar_url}
              level={comment.author.level}
              size={depth > 0 ? "xs" : "sm"}
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <Link
                href={`/u/${comment.author.username}`}
                className="text-sm font-bold transition-colors hover:text-brand-300"
              >
                {comment.author.display_name || comment.author.username}
              </Link>
              <LevelBadge level={comment.author.level} size="xs" />
              {comment.author.role === "admin" && <AdminBadge />}
              <time
                dateTime={comment.created_at}
                title={new Date(comment.created_at).toLocaleString()}
                className="text-xs text-ink-faint"
              >
                {timeAgo(comment.created_at)}
              </time>
            </div>

            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-muted">
              {comment.body}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <StarButton
                targetId={comment.id}
                kind="comment"
                starred={comment.viewer_starred}
                count={comment.star_count}
                canInteract={Boolean(viewer)}
                size="sm"
              />

              {viewer && depth < 1 && (
                <button
                  type="button"
                  onClick={() => setReplying((r) => !r)}
                  className="inline-flex items-center gap-1.5 rounded-pill border border-white/10 bg-white/[0.04] px-2 py-1 text-[0.7rem] font-semibold text-ink-muted transition-colors hover:border-brand-400/40 hover:text-brand-300"
                >
                  <MessageSquare className="h-3 w-3" />
                  Reply
                </button>
              )}

              {canDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 rounded-pill px-2 py-1 text-[0.7rem] font-semibold text-ink-faint transition-colors hover:text-danger"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              )}
            </div>

            {replying && viewer && (
              <div className="mt-3">
                <CommentForm
                  postId={postId}
                  parentId={comment.id}
                  profile={viewer}
                  autoFocus
                  onDone={() => {
                    setReplying(false);
                    setShowReplies(true);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {replies.length > 0 && (
        <>
          {!showReplies ? (
            <button
              type="button"
              onClick={() => setShowReplies(true)}
              className="ml-4 inline-flex items-center gap-1.5 pb-3 text-xs font-semibold text-brand-300 transition-colors hover:text-brand-200 sm:ml-6"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              View {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </button>
          ) : (
            <ul>
              {replies.map((reply) => (
                <CommentNode
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  viewer={viewer}
                  depth={depth + 1}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </li>
  );
}

export function CommentThread({
  comments,
  postId,
  viewer,
}: {
  comments: Comment[];
  postId: number;
  viewer: Profile | null;
}) {
  if (comments.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-ink-faint">
        No comments yet. Say the first thing.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-white/6">
      {comments.map((comment) => (
        <CommentNode key={comment.id} comment={comment} postId={postId} viewer={viewer} />
      ))}
    </ul>
  );
}
