"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Check, ChevronDown, Gamepad2, Loader2, Send } from "lucide-react";
import { createPost } from "@/lib/actions";
import { ImageDropzone } from "@/components/compose/ImageDropzone";
import { EXP_REWARDS } from "@/lib/exp";
import type { ActionResult, Game } from "@/lib/types";
import { cn, ratingVerdict } from "@/lib/utils";

const DRAFT_KEY = "expoints:draft";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary inline-flex h-12 items-center justify-center gap-2 rounded-xl px-7 font-display text-sm uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Posting…
        </>
      ) : (
        <>
          <Send className="h-4 w-4" />
          Publish · +{EXP_REWARDS.post_created} EXP
        </>
      )}
    </button>
  );
}

/**
 * Game picker: a searchable combobox over the catalogue that also accepts
 * anything you type.
 *
 * The PHP form was a <select> of eight hardcoded titles plus an "Other" option
 * that revealed a second text input. Here the free-text value IS the value, and
 * `upsert_game` on the server finds-or-creates the row, so every game gets a
 * canonical hub page whether or not it was seeded.
 */
function GamePicker({ games, defaultValue }: { games: Game[]; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const term = value.trim().toLowerCase();
    if (!term) return games.slice(0, 8);
    return games.filter((g) => g.name.toLowerCase().includes(term)).slice(0, 8);
  }, [games, value]);

  const exactMatch = games.some((g) => g.name.toLowerCase() === value.trim().toLowerCase());

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && matches[highlight]) {
      e.preventDefault();
      setValue(matches[highlight].name);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <label
        htmlFor="game-input"
        className="mb-1.5 block font-display text-[0.72rem] font-bold uppercase tracking-widest text-ink-muted"
      >
        Game
      </label>

      <div className="relative">
        <Gamepad2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          id="game-input"
          name="game"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search or type any game…"
          autoComplete="off"
          required
          role="combobox"
          aria-expanded={open}
          aria-controls="game-listbox"
          className="field !pl-10 pr-10"
        />
        <ChevronDown
          className={cn(
            "pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint transition-transform",
            open && "rotate-180",
          )}
        />
      </div>

      {open && (
        <div
          id="game-listbox"
          role="listbox"
          className="popover absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl p-1.5"
        >
          {matches.map((game, i) => (
            <button
              key={game.id}
              type="button"
              role="option"
              aria-selected={i === highlight}
              onClick={() => {
                setValue(game.name);
                setOpen(false);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                i === highlight ? "bg-brand-500/18" : "hover:bg-white/5",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{game.name}</span>
                <span className="block text-[0.68rem] text-ink-faint">
                  {game.release_year ? `${game.release_year} · ` : ""}
                  {game.post_count} review{game.post_count === 1 ? "" : "s"}
                </span>
              </span>
              {game.name.toLowerCase() === value.trim().toLowerCase() && (
                <Check className="h-4 w-4 shrink-0 text-success" />
              )}
            </button>
          ))}

          {value.trim() && !exactMatch && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg border-t border-white/8 px-3 py-2.5 text-left text-sm text-brand-300 transition-colors hover:bg-white/5"
            >
              <Gamepad2 className="h-3.5 w-3.5" />
              Review “{value.trim()}” — we&apos;ll add it to the catalogue
            </button>
          )}

          {matches.length === 0 && !value.trim() && (
            <p className="px-3 py-4 text-center text-sm text-ink-faint">
              Start typing to find a game.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** 1–10 score slider with a live verdict label. */
function RatingSlider({ defaultValue = 8 }: { defaultValue?: number }) {
  const [rating, setRating] = useState(defaultValue);
  const { label, color } = ratingVerdict(rating);

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label
          htmlFor="rating"
          className="font-display text-[0.72rem] font-bold uppercase tracking-widest text-ink-muted"
        >
          Your score
        </label>
        <span className="flex items-baseline gap-2">
          <span className="stat text-2xl font-extrabold" style={{ color }}>
            {rating}
          </span>
          <span className="text-xs text-ink-faint">/ 10</span>
          <span
            className="font-display text-[0.7rem] font-bold uppercase tracking-widest"
            style={{ color }}
          >
            {label}
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
        className="h-2 w-full cursor-pointer appearance-none rounded-pill bg-abyss/80 outline-none ring-1 ring-inset ring-white/10 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full"
        style={{
          background: `linear-gradient(90deg, ${color} ${((rating - 1) / 9) * 100}%, rgba(255,255,255,0.06) ${((rating - 1) / 9) * 100}%)`,
          // Thumb colour has to come through a custom property for both engines.
          accentColor: color,
        }}
      />

      <div className="mt-1 flex justify-between text-[0.62rem] text-ink-faint">
        <span>1 · Avoid</span>
        <span>10 · Masterpiece</span>
      </div>
    </div>
  );
}

export function Composer({ games, userId }: { games: Game[]; userId: string }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(createPost, null);

  // Draft autosave — the old inline composer lost everything on any navigation.
  const [draft, setDraft] = useState<{ title: string; content: string; game: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) setDraft(JSON.parse(saved));
    } catch {
      // Corrupt or unavailable storage — just start with a blank form.
    }
  }, []);

  const saveDraft = () => {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const payload = {
      title: String(data.get("title") ?? ""),
      content: String(data.get("content") ?? ""),
      game: String(data.get("game") ?? ""),
    };
    if (payload.title || payload.content) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    }
  };

  // A successful post redirects, so anything still here means the draft is live.
  useEffect(() => {
    return () => {
      if (state?.ok) localStorage.removeItem(DRAFT_KEY);
    };
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      onChange={saveDraft}
      className="glass-strong space-y-5 rounded-3xl p-5 sm:p-7"
    >
      {state && !state.ok && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-danger/40 bg-danger/12 px-3.5 py-3"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <p className="text-sm text-rose-100">{state.error}</p>
        </div>
      )}

      <GamePicker games={games} defaultValue={draft?.game} />

      <label className="block">
        <span className="mb-1.5 block font-display text-[0.72rem] font-bold uppercase tracking-widest text-ink-muted">
          Title
        </span>
        <input
          name="title"
          defaultValue={draft?.title}
          required
          maxLength={160}
          placeholder="Give your take a headline…"
          className="field font-display text-lg font-bold"
        />
      </label>

      <RatingSlider />

      <label className="block">
        <span className="mb-1.5 block font-display text-[0.72rem] font-bold uppercase tracking-widest text-ink-muted">
          Your review
        </span>
        <textarea
          name="content"
          defaultValue={draft?.content}
          required
          rows={10}
          placeholder="What worked? What didn't? Would you recommend it, and to who?"
          className="field resize-y leading-relaxed"
        />
      </label>

      <ImageDropzone userId={userId} />

      <div className="flex flex-col items-stretch gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-ink-faint">
          Drafts save automatically. Reviews from banned accounts are hidden forum-wide.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
