"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2, Flag, Loader2 } from "lucide-react";
import { reportContent } from "@/lib/actions";
import type { ActionResult } from "@/lib/types";

const REASONS = [
  "Harassment or personal attacks",
  "Hate speech or slurs",
  "Spam or advertising",
  "Off-topic or low-effort",
  "Spoilers without warning",
  "Something else",
];

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl disabled:opacity-70"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
      Submit report
    </button>
  );
}

export default function ReportPage() {
  const params = useSearchParams();
  const postId = params.get("post");
  const commentId = params.get("comment");

  const [state, action] = useActionState<ActionResult | null, FormData>(reportContent, null);

  // Reset scroll so the confirmation is visible on small screens.
  useEffect(() => {
    if (state?.ok) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state]);

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
      <Link
        href={postId ? `/post/${postId}` : "/feed"}
        className="group mb-5 inline-flex items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back
      </Link>

      <div className="glass-strong rounded-3xl p-6 sm:p-7">
        {state?.ok ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-success" />
            <h1 className="font-display text-xl font-extrabold">Report sent</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              An admin will review it. Thanks for helping keep the forum civil.
            </p>
            <Link
              href="/feed"
              className="btn-ghost mt-6 inline-flex h-11 items-center rounded-xl px-6 text-sm"
            >
              Back to feed
            </Link>
          </div>
        ) : (
          <>
            <header className="mb-5">
              <h1 className="flex items-center gap-2.5 font-display text-2xl font-extrabold">
                <Flag className="h-6 w-6 text-danger" />
                Report content
              </h1>
              <p className="mt-2 text-sm text-ink-muted">
                Tell us what&apos;s wrong. Reports are private and go straight to the admin queue.
              </p>
            </header>

            <form action={action} className="space-y-4">
              {postId && <input type="hidden" name="post_id" value={postId} />}
              {commentId && <input type="hidden" name="comment_id" value={commentId} />}

              {state && !state.ok && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-danger/40 bg-danger/12 px-3.5 py-3"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                  <p className="text-sm text-rose-100">{state.error}</p>
                </div>
              )}

              <fieldset>
                <legend className="mb-2 font-display text-[0.72rem] font-bold uppercase tracking-widest text-ink-muted">
                  What&apos;s the problem?
                </legend>
                <div className="space-y-2">
                  {REASONS.map((reason) => (
                    <label
                      key={reason}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition-colors hover:border-brand-400/40 has-[:checked]:border-brand-400/60 has-[:checked]:bg-brand-500/12"
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={reason}
                        required
                        className="h-4 w-4 accent-[var(--color-brand-400)]"
                      />
                      <span className="text-sm">{reason}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <Submit />
            </form>
          </>
        )}
      </div>
    </div>
  );
}
