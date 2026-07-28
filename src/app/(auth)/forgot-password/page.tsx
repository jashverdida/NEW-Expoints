"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { requestPasswordReset } from "@/lib/actions";
import type { ActionResult } from "@/lib/types";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary flex h-12 w-full items-center justify-center gap-2 rounded-xl disabled:opacity-70"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
      Send reset link
    </button>
  );
}

export default function ForgotPasswordPage() {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    requestPasswordReset,
    null,
  );

  return (
    <div className="w-full max-w-md">
      <div className="mb-7 text-center">
        <h1 className="font-display text-3xl font-extrabold">
          <span className="text-gradient">Lost your password?</span>
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Happens to the best of us. We&apos;ll email you a reset link.
        </p>
      </div>

      <div className="glass-strong animate-rise rounded-3xl p-6 sm:p-8">
        {state?.ok ? (
          <div className="space-y-4 py-4 text-center">
            <CheckCircle2 className="mx-auto h-11 w-11 text-success" />
            <p className="text-sm leading-relaxed text-ink-muted">{state.message}</p>
            <Link
              href="/login"
              className="btn-ghost inline-flex h-11 items-center justify-center rounded-xl px-6"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <form action={action} className="space-y-4">
            {state && !state.ok && (
              <p className="rounded-xl border border-danger/40 bg-danger/12 px-3.5 py-3 text-sm text-rose-100">
                {state.error}
              </p>
            )}

            <label className="block">
              <span className="mb-1.5 block font-display text-[0.72rem] font-bold uppercase tracking-widest text-ink-muted">
                Email
              </span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="field"
              />
            </label>

            <Submit />

            <p className="text-center text-sm text-ink-faint">
              Remembered it?{" "}
              <Link href="/login" className="font-semibold text-brand-300 hover:text-brand-200">
                Log in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
