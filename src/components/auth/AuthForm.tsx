"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { AlertCircle, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
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

/**
 * Controlled text field.
 *
 * Controlled on purpose. React resets an uncontrolled `<form action={fn}>`
 * after the action finishes — which is why a single username complaint used to
 * wipe the email, display name and both passwords. Holding the values in React
 * state means only what we explicitly clear gets cleared.
 */
function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required = true,
  autoComplete,
  hint,
  prefix,
  maxLength,
  invalid = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (next: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
  prefix?: string;
  maxLength?: number;
  invalid?: boolean;
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={isPassword && reveal ? "text" : type}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          maxLength={maxLength}
          aria-invalid={invalid || undefined}
          className={cn(
            "field",
            prefix && "pl-8",
            isPassword && "pr-11",
            invalid && "!border-danger/70 focus:!border-danger",
          )}
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

/**
 * Clears and focuses the field the server flagged, leaving everything else
 * intact. Runs once per distinct result — the ref guard stops it re-firing on
 * unrelated re-renders and stealing focus while the user is typing.
 */
function useFieldError(
  state: ActionResult | null,
  clear: (field: string) => void,
) {
  const handled = useRef<ActionResult | null>(null);

  useEffect(() => {
    if (!state || state.ok || handled.current === state) return;
    handled.current = state;

    const field = state.field;
    if (!field) return;

    clear(field);
    // Let the state flush before moving focus, or React re-renders over it.
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLInputElement>(`input[name="${field}"]`);
      el?.focus();
    });
    // `clear` is recreated each render; keying on state alone is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(signIn, null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Wrong credentials: keep the email, clear only the password.
  const handled = useRef<ActionResult | null>(null);
  useEffect(() => {
    if (!state || state.ok || handled.current === state) return;
    handled.current = state;
    setPassword("");
  }, [state]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      {state && !state.ok && <ErrorBanner message={state.error} />}

      <Field
        label="Email"
        name="email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        autoComplete="email"
      />
      <Field
        label="Password"
        name="password"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="Your password"
        autoComplete="current-password"
      />

      <SubmitButton label="ENTER THE FORUM" />
    </form>
  );
}

const EMPTY_REGISTER = {
  username: "",
  display_name: "",
  email: "",
  password: "",
  confirm: "",
};

export function RegisterForm() {
  const [state, action] = useActionState<ActionResult | null, FormData>(signUp, null);
  const [values, setValues] = useState(EMPTY_REGISTER);

  const set = (key: keyof typeof EMPTY_REGISTER) => (next: string) =>
    setValues((v) => ({ ...v, [key]: next }));

  useFieldError(state, (field) => {
    setValues((v) => ({
      ...v,
      [field]: "",
      // A rejected password invalidates the confirmation too — leaving a stale
      // copy behind would just fail the match check on the next submit.
      ...(field === "password" ? { confirm: "" } : {}),
    }));
  });

  const invalidField = state && !state.ok ? state.field : undefined;

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
        value={values.username}
        onChange={set("username")}
        invalid={invalidField === "username"}
        placeholder="ShadowSlayer"
        prefix="@"
        autoComplete="username"
        maxLength={24}
        hint="3–24 characters. Letters, numbers and underscores. This is your handle."
      />
      <Field
        label="Display name"
        name="display_name"
        value={values.display_name}
        onChange={set("display_name")}
        placeholder="What people should call you"
        required={false}
        autoComplete="name"
        maxLength={60}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        value={values.email}
        onChange={set("email")}
        invalid={invalidField === "email"}
        placeholder="you@example.com"
        autoComplete="email"
      />
      <Field
        label="Password"
        name="password"
        type="password"
        value={values.password}
        onChange={set("password")}
        invalid={invalidField === "password"}
        placeholder="At least 8 characters"
        autoComplete="new-password"
      />
      <Field
        label="Confirm password"
        name="confirm"
        type="password"
        value={values.confirm}
        onChange={set("confirm")}
        invalid={invalidField === "confirm"}
        placeholder="Type it again"
        autoComplete="new-password"
      />

      <SubmitButton label="START AT LEVEL 1" />
    </form>
  );
}
