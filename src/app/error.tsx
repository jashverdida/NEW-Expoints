"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

/**
 * Root error boundary. Shows a recoverable message rather than a white screen,
 * and logs the digest so the failure is traceable in Vercel's logs.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[EXPoints]", error);
  }, [error]);

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="glass-strong w-full max-w-md rounded-3xl p-8 text-center">
        <Logo className="mb-6 text-xl" />

        <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-danger/12 text-danger ring-1 ring-danger/30">
          <AlertTriangle className="h-6 w-6" />
        </span>

        <h1 className="font-display text-xl font-extrabold">Something broke</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          That&apos;s on us, not you. Try again — if it keeps happening, the error reference below
          will help us track it down.
        </p>

        {error.digest && (
          <p className="stat mt-4 rounded-lg bg-abyss/60 px-3 py-2 text-xs text-ink-faint">
            {error.digest}
          </p>
        )}

        <button
          type="button"
          onClick={reset}
          className="btn-primary mt-6 inline-flex h-12 items-center gap-2 rounded-xl px-6 text-sm"
        >
          <RotateCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
