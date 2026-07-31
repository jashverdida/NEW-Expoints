"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, KeyRound, Loader2 } from "lucide-react";
import { markNotificationsRead, requestPasswordReset } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import type { ActionResult } from "@/lib/types";

/**
 * Clears the notification badge.
 *
 * Optimistic on purpose — the button reports done and disables itself straight
 * away, then refreshes so the bell and the count on this page agree. Marking
 * things read is not an operation anyone needs to watch a spinner for.
 */
export function MarkAllReadButton({ unread }: { unread: number }) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(unread === 0);

  const run = () => {
    setDone(true);
    startTransition(async () => {
      const result = await markNotificationsRead();
      if (!result.ok) {
        setDone(false);
        push(result.error ?? "Could not mark those read.", "error");
        return;
      }
      push("All caught up.", "success");
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={done || pending}
      className="btn-ghost inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
      {done ? "Nothing unread" : "Mark all read"}
    </button>
  );
}

/**
 * Sends a password reset link to the address on the account.
 *
 * Deliberately not an in-page "new password" field. Changing a password from a
 * live session with no re-authentication is the kind of thing that turns a
 * borrowed laptop into a stolen account — the emailed link proves the person
 * asking still controls the inbox. It reuses the same action the forgotten
 * password flow uses, so there's one code path to keep correct.
 */
export function PasswordResetButton({ email }: { email: string }) {
  const { push } = useToast();
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    requestPasswordReset,
    null,
  );

  useEffect(() => {
    if (!state) return;
    push(state.ok ? (state.message ?? "Reset link sent.") : (state.error ?? "Something went wrong."), state.ok ? "success" : "error");
  }, [state, push]);

  return (
    <form action={action}>
      <input type="hidden" name="email" value={email} />
      <button
        type="submit"
        disabled={pending}
        className="btn-ghost inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        Send reset link
      </button>
    </form>
  );
}
