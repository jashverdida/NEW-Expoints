"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Save, Trash2 } from "lucide-react";
import { deletePost, updatePost } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import type { ActionResult, FeedPostWithViewer } from "@/lib/types";
import { ratingVerdict } from "@/lib/utils";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary inline-flex h-12 items-center justify-center gap-2 rounded-xl px-7 font-display text-sm uppercase tracking-widest disabled:opacity-70"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      Save changes
    </button>
  );
}

/**
 * Edit an existing review.
 *
 * The game can't be changed here on purpose: a review's game determines which
 * hub it appears under and feeds that game's aggregate score, so switching it
 * after the fact would silently move stars and ratings between games. Delete
 * and repost if you picked the wrong one.
 */
export function EditPostForm({ post }: { post: FeedPostWithViewer }) {
  const router = useRouter();
  const { push } = useToast();
  const [state, action] = useActionState<ActionResult | null, FormData>(updatePost, null);
  const [rating, setRating] = useState(post.rating ?? 8);
  const [deleting, setDeleting] = useState(false);

  const verdict = ratingVerdict(rating);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      push(state.message ?? "Saved.", "success");
      router.push(`/post/${post.id}`);
    } else {
      push(state.error, "error");
    }
  }, [state, push, router, post.id]);

  const handleDelete = async () => {
    if (!confirm("Delete this review permanently? This can't be undone.")) return;
    setDeleting(true);
    const result = await deletePost(post.id);
    if (result.ok) {
      push("Review deleted.", "success");
      router.push("/feed");
    } else {
      push(result.error, "error");
      setDeleting(false);
    }
  };

  return (
    <>
      <form action={action} className="glass-strong space-y-5 rounded-3xl p-5 sm:p-7">
        <input type="hidden" name="post_id" value={post.id} />

        {state && !state.ok && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-danger/40 bg-danger/12 px-3.5 py-3"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <p className="text-sm text-rose-100">{state.error}</p>
          </div>
        )}

        {post.game_name && (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-ink-muted">
            Reviewing <span className="font-semibold text-brand-300">{post.game_name}</span>
            <span className="mt-0.5 block text-xs text-ink-faint">
              The game can&apos;t be changed after posting — it feeds that game&apos;s average score.
            </span>
          </p>
        )}

        <label className="block">
          <span className="mb-1.5 block font-display text-[0.72rem] font-bold uppercase tracking-widest text-ink-muted">
            Title
          </span>
          <input
            name="title"
            defaultValue={post.title}
            required
            maxLength={160}
            className="field font-display text-lg font-bold"
          />
        </label>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label
              htmlFor="rating"
              className="font-display text-[0.72rem] font-bold uppercase tracking-widest text-ink-muted"
            >
              Your score
            </label>
            <span className="flex items-baseline gap-2">
              <span className="stat text-2xl font-extrabold" style={{ color: verdict.color }}>
                {rating}
              </span>
              <span className="text-xs text-ink-faint">/ 10</span>
              <span
                className="font-display text-[0.7rem] font-bold uppercase tracking-widest"
                style={{ color: verdict.color }}
              >
                {verdict.label}
              </span>
            </span>
          </div>

          <input
            id="rating"
            name="rating"
            type="range"
            min={1}
            max={10}
            step={1}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-pill outline-none ring-1 ring-inset ring-white/10"
            style={{
              background: `linear-gradient(90deg, ${verdict.color} ${((rating - 1) / 9) * 100}%, rgba(255,255,255,0.06) ${((rating - 1) / 9) * 100}%)`,
              accentColor: verdict.color,
            }}
          />
        </div>

        <label className="block">
          <span className="mb-1.5 block font-display text-[0.72rem] font-bold uppercase tracking-widest text-ink-muted">
            Your review
          </span>
          <textarea
            name="content"
            defaultValue={post.content}
            required
            rows={12}
            className="field resize-y leading-relaxed"
          />
        </label>

        <div className="flex justify-end border-t border-white/8 pt-5">
          <Submit />
        </div>
      </form>

      <section className="glass mt-5 rounded-3xl border-danger/25 p-5 sm:p-6">
        <h2 className="rule-label mb-3 !text-danger/80">Danger zone</h2>
        <p className="mb-4 text-sm text-ink-muted">
          Deleting removes the review, its comments and the EXP it earned.
        </p>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-5 text-sm font-semibold text-danger transition-colors hover:bg-danger/20 disabled:opacity-60"
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete review
        </button>
      </section>
    </>
  );
}
