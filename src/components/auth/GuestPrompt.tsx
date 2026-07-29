"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, MessageSquare, Sparkles, Star, X } from "lucide-react";

/**
 * The "you need an account for that" gate.
 *
 * Guests can read every review on /discover, but starring, saving and
 * commenting all require an account. A toast was too easy to miss — this is a
 * proper modal that names the specific thing they tried to do and puts the
 * signup button directly under it.
 */

export type GuestAction = "star" | "bookmark" | "comment";

const COPY: Record<
  GuestAction,
  { icon: React.ElementType; accent: string; title: string; body: string; cta: string }
> = {
  star: {
    icon: Star,
    accent: "#fbbf24",
    title: "Stars decide what's good",
    body: "Stars are how this forum sorts the great reviews from the noise. Create an account to cast yours — and start earning EXP the moment someone stars you back.",
    cta: "Create an account",
  },
  bookmark: {
    icon: Bookmark,
    accent: "#34d399",
    title: "Your vault is locked",
    body: "Saved reviews follow you to every device you sign in from. Grab an account and start building the pile you'll actually come back to.",
    cta: "Start my vault",
  },
  comment: {
    icon: MessageSquare,
    accent: "#38bdf8",
    title: "Got a take? Prove it",
    body: "Replies, arguments and hot takes are the whole point. Sign up to join the thread — good comments earn EXP too.",
    cta: "Join the conversation",
  },
};

const GuestPromptContext = createContext<{ prompt: (action: GuestAction) => void }>({
  prompt: () => {},
});

/** Call this from any interactive control that requires an account. */
export function useGuestPrompt() {
  return useContext(GuestPromptContext);
}

/**
 * Stand-in for the comment box on a post a guest is reading. Server components
 * can't call the hook, so this thin client wrapper carries the click.
 */
export function GuestCommentBar() {
  const { prompt } = useGuestPrompt();

  return (
    <button
      type="button"
      onClick={() => prompt("comment")}
      className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition-colors hover:border-brand-400/40"
    >
      <MessageSquare className="h-4 w-4 shrink-0 text-brand-300" />
      <span className="text-sm text-ink-muted">
        Got a take on this? <span className="font-semibold text-brand-300">Sign up to reply.</span>
      </span>
    </button>
  );
}

export function GuestPromptProvider({ children }: { children: React.ReactNode }) {
  const [action, setAction] = useState<GuestAction | null>(null);

  const prompt = useCallback((next: GuestAction) => setAction(next), []);
  const value = useMemo(() => ({ prompt }), [prompt]);

  const copy = action ? COPY[action] : null;
  const Icon = copy?.icon ?? Sparkles;

  return (
    <GuestPromptContext.Provider value={value}>
      {children}

      <AnimatePresence>
        {copy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[95] grid place-items-end bg-abyss/80 backdrop-blur-sm sm:place-items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-prompt-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setAction(null);
            }}
          >
            {/* Bottom sheet on phones, centred dialog on desktop. */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="popover relative w-full max-w-md overflow-hidden rounded-t-3xl p-6 pb-safe sm:rounded-3xl sm:pb-6"
            >
              {/* Accent bloom keyed to the action. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full opacity-40 blur-3xl"
                style={{ background: copy.accent }}
              />

              <button
                type="button"
                onClick={() => setAction(null)}
                aria-label="Close"
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-white/8 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative text-center">
                <span
                  className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl ring-1"
                  style={{
                    background: `${copy.accent}1f`,
                    color: copy.accent,
                    boxShadow: `0 0 30px -8px ${copy.accent}`,
                  }}
                >
                  <Icon className="h-6 w-6" />
                </span>

                <h2
                  id="guest-prompt-title"
                  className="font-display text-xl font-extrabold tracking-tight sm:text-2xl"
                >
                  {copy.title}
                </h2>

                <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-ink-muted">
                  {copy.body}
                </p>

                <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                  <Link
                    href="/register"
                    className="btn-primary inline-flex h-12 flex-1 items-center justify-center rounded-xl text-sm font-bold"
                  >
                    {copy.cta}
                  </Link>
                  <Link
                    href="/login"
                    className="btn-ghost inline-flex h-12 flex-1 items-center justify-center rounded-xl text-sm"
                  >
                    I already have one
                  </Link>
                </div>

                <p className="mt-4 text-[0.7rem] text-ink-faint">
                  Free, takes a minute, and you start at Level 1.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </GuestPromptContext.Provider>
  );
}
