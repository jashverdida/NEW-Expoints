"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { AlertCircle, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { useState } from "react";
import { signIn, signUp } from "@/lib/actions";
import type { ActionResult } from "@/lib/types";
import { cn } from "@/lib/utils";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[0.95rem] tracking-wide disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </>
      ) : (
        label
      )}
    </button>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required = true,
  autoComplete,
  hint,
  prefix,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
  prefix?: string;
  maxLength?: number;
}) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="block">
      <span className="mb-1.5 block font-display text-[0.72rem] font-bold uppercase tracking-widest text-ink-muted">
        {label}
      </span>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-display text-sm font-bold text-ink-faint">
            {prefix}
          </span>
        )}
        <input
          name={name}
          type={isPassword && reveal ? "text" : type}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={cn("field", prefix && "pl-8", isPassword && "pr-11")}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-faint transition-colors hover:text-ink"
          >
            {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint && <span className="mt-1 block text-[0.7rem] text-ink-faint">{hint}</span>}
    </label>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2.5 rounded-xl border border-danger/40 bg-danger/12 px-3.5 py-3"
      role="alert"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
      <p className="text-sm leading-snug text-rose-100">{message}</p>
    </motion.div>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(signIn, null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      {state && !state.ok && <ErrorBanner message={state.error} />}

      <Field
        label="Email"
        name="email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
      />
      <Field
        label="Password"
        name="password"
        type="password"
        placeholder="Your password"
        autoComplete="current-password"
      />

      <SubmitButton label="ENTER THE FORUM" />
    </form>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState<ActionResult | null, FormData>(signUp, null);

  /*
   * A successful signup either redirects (session created immediately) or comes
   * back with `ok: true` and a message, which means the project requires email
   * confirmation. Show that clearly rather than leaving a filled-in form.
   */
  if (state?.ok) {
    return (
      <div className="py-6 text-center">
        <MailCheck className="mx-auto mb-4 h-12 w-12 text-success" />
        <h2 className="font-display text-xl font-extrabold">Check your inbox</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{state.message}</p>
        <p className="mt-4 text-xs text-ink-faint">
          Nothing there? Check spam — the link can take a minute.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state && !state.ok && <ErrorBanner message={state.error} />}

      <Field
        label="Username"
        name="username"
        placeholder="ShadowSlayer"
        prefix="@"
        autoComplete="username"
        maxLength={24}
        hint="3–24 characters. Letters, numbers and underscores. This is your handle."
      />
      <Field
        label="Display name"
        name="display_name"
        placeholder="What people should call you"
        required={false}
        autoComplete="name"
        maxLength={60}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
      />
      <Field
        label="Password"
        name="password"
        type="password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
      />
      <Field
        label="Confirm password"
        name="confirm"
        type="password"
        placeholder="Type it again"
        autoComplete="new-password"
      />

      <SubmitButton label="START AT LEVEL 1" />
    </form>
  );
}
