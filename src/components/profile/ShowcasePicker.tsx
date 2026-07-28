"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Lock, Star, X } from "lucide-react";
import { setPinnedPosts } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import type { FeedPostWithViewer } from "@/lib/types";
import { cn, compactNumber, timeAgo } from "@/lib/utils";

const MAX_PINS = 3;
const UNLOCK_LEVEL = 10;

/**
 * Lets a user choose up to three reviews to feature on their profile.
 *
 * This is the "Showcase" perk advertised at Level 10 in PERKS — the server
 * action existed from the start but nothing ever called it, so the perk was
 * unreachable. Gated at the same level the perk claims, so the promise and the
 * behaviour match.
 */
export function ShowcasePicker({
  posts,
  pinned,
  level,
}: {
  posts: FeedPostWithViewer[];
  pinned: number[];
  level: number;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>(pinned);
  const [saving, startSaving] = useTransition();

  const unlocked = level >= UNLOCK_LEVEL;

  const toggle = (id: number) => {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (current.length >= MAX_PINS) {
        push(`You can feature ${MAX_PINS} reviews. Deselect one first.`, "info");
        return current;
      }
      return [...current, id];
    });
  };

  const save = () => {
    startSaving(async () => {
      const result = await setPinnedPosts(selected);
      if (result.ok) {
        push(result.message ?? "Showcase updated.", "success");
        setOpen(false);
        router.refresh();
      } else {
        push(result.error, "error");
      }
    });
  };

  if (!unlocked) {
    return (
      <p className="glass flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm text-ink-faint">
        <Lock className="h-4 w-4 shrink-0" />
        Reach <span className="stat font-bold text-ink-muted">Level {UNLOCK_LEVEL}</span> to feature
        your best reviews on your profile.
      </p>
    );
  }

  if (posts.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSelected(pinned);
          setOpen(true);
        }}
        className="btn-ghost inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm"
      >
        <Star className="h-4 w-4 text-exp" />
        {pinned.length > 0 ? "Edit showcase" : "Choose your best reviews"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] grid place-items-end bg-abyss/80 backdrop-blur-sm sm:place-items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Choose showcase reviews"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          {/* Bottom sheet on phones, centred dialog on desktop. */}
          <div className="glass-strong flex max-h-[85dvh] w-full flex-col rounded-t-3xl sm:max-w-lg sm:rounded-3xl">
            <header className="flex items-center justify-between border-b border-white/8 p-5">
              <div>
                <h2 className="font-display text-lg font-bold">Your showcase</h2>
                <p className="mt-0.5 text-xs text-ink-faint">
                  Pick up to {MAX_PINS} — {selected.length}/{MAX_PINS} selected
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-white/6 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <ul className="space-y-2">
                {posts.map((post) => {
                  const isSelected = selected.includes(post.id);
                  const order = selected.indexOf(post.id) + 1;

                  return (
                    <li key={post.id}>
                      <button
                        type="button"
                        onClick={() => toggle(post.id)}
                        aria-pressed={isSelected}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors",
                          isSelected
                            ? "border-exp/50 bg-exp/10"
                            : "border-white/8 bg-white/[0.03] hover:border-brand-400/40",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg text-xs font-bold",
                            isSelected
                              ? "bg-exp text-[#2a1a00]"
                              : "border border-white/15 text-transparent",
                          )}
                        >
                          {isSelected ? order : <Check className="h-3 w-3" />}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display text-sm font-bold">
                            {post.title}
                          </span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[0.7rem] text-ink-faint">
                            {post.game_name && <span className="truncate">{post.game_name}</span>}
                            <span aria-hidden="true">·</span>
                            <span className="stat">
                              {compactNumber(post.star_count)} stars
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{timeAgo(post.created_at)}</span>
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-white/8 p-4 pb-safe">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-11 rounded-xl px-5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="btn-primary inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm disabled:opacity-70"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save showcase
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
