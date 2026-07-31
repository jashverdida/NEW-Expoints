"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen } from "lucide-react";
import { useT } from "@/components/shell/PrefsProvider";
import type { Translate } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The EXPoints user manual — a hardcover book that opens inside the app.
 *
 * Deliberately not a modal with tabs. Sheets hinge on their left edge, the book
 * slides so the open spread stays centred, and every inner page carries both a
 * printed folio and a giant ghost numeral clipped by the page edge. All of the
 * 3D is CSS transforms in globals.css; nothing here is a library.
 *
 * EVERY CLAIM IN HERE IS CHECKED AGAINST THE CODE
 * The rating scale, the search filters, the leaderboard scopes, the composer's
 * fields, the preference switches — each was read out of the component that
 * implements it before it was written down. A manual that describes a button
 * that isn't there is worse than no manual.
 *
 * The EXP economy is covered on the landing page, so the book only mentions it
 * in passing and spends its pages on the thing people actually get lost in:
 * which screen is for what.
 */

/** One label per spread. Index is the number of sheets currently turned. */
const SPREADS = ["Cover", "Pages 1–2", "Pages 3–4", "Pages 5–6", "Pages 7–8", "Back page"];

/** 750ms CSS transition plus a buffer. Not transitionend — that fires per
 *  property and would double-fire here. */
const FLIP_MS = 780;

/**
 * Section colours, matching what each screen actually turns the app into.
 * Literal hex rather than tokens because these represent OTHER sections while
 * you're reading — the surrounding book is already wearing the current one.
 */
const SCREEN_COLORS = {
  feed: "#38a0ff",
  trending: "#ff6b4a",
  fresh: "#c084fc",
  games: "#38bdf8",
  ranks: "#fbbf24",
  saved: "#34d399",
} as const;

export function UserManual() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const openManual = useCallback(() => setOpen(true), []);
  const closeManual = useCallback(() => {
    setOpen(false);
    // Send focus back where it came from, or the reader is dumped at the top of
    // the document with no idea where they were.
    triggerRef.current?.focus();
  }, []);

  // Deep link, and a convenient way to check layout without clicking through.
  useEffect(() => {
    if (window.location.hash === "#manual") setOpen(true);
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openManual}
        aria-label="Open the user manual"
        title="User manual"
        className={cn(
          "hidden h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/4",
          "text-ink-muted transition-colors hover:border-brand-400/40 hover:bg-white/8 hover:text-brand-200 sm:grid",
        )}
      >
        <BookOpen className="h-4 w-4" />
      </button>

      {/*
        PORTALLED TO <body>, AND IT HAS TO BE.

        The trigger lives in the header, and the header carries a
        `backdrop-filter` for its frosted glass. A filtered element becomes the
        containing block for every `position: fixed` descendant — so rendered in
        place, the overlay's `inset: 0` resolved against the HEADER's box rather
        than the viewport. The dim covered the search bar and nothing else, and
        the book got squashed into that strip while the dashboard carried on
        painting over the top of it.

        No amount of z-index fixes that; the overlay has to leave the header's
        containing block entirely. `open` is only ever true after a click or the
        deep-link effect, both of which run on the client, so `document` is
        always there by the time this evaluates.
      */}
      {open && createPortal(<ManualOverlay onClose={closeManual} t={t} />, document.body)}
    </>
  );
}

function ManualOverlay({ onClose, t }: { onClose: () => void; t: Translate }) {
  const [state, setState] = useState(0);
  const [turning, setTurning] = useState<number | null>(null);
  const animating = useRef(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const sheets = buildSheets(t);

  const flip = useCallback(
    (dir: 1 | -1) => {
      if (animating.current) return; // ignore input mid-turn
      setState((current) => {
        const next = current + dir;
        if (next < 0 || next > sheets.length) return current;

        animating.current = true;
        setTurning(dir > 0 ? current : current - 1);
        window.setTimeout(() => {
          animating.current = false;
          setTurning(null);
        }, FLIP_MS);

        return next;
      });
    },
    [sheets.length],
  );

  // Freeze the page behind. The book must never move because the app scrolled.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Bound on open, removed on close — never left live.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") flip(1);
      else if (e.key === "ArrowLeft") flip(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [flip, onClose]);

  /**
   * Which page a click turns.
   *
   * A right-hand page is a `.sheet-front` and turns forward; a left-hand page is
   * a `.sheet-back` and turns back. One delegated listener rather than a handler
   * per face.
   */
  const onBookClick = (e: React.MouseEvent) => {
    const face = (e.target as HTMLElement).closest(".sheet-face");
    if (!face) return;
    flip(face.classList.contains("sheet-back") ? -1 : 1);
  };

  return (
    <div
      className="manual-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="EXPoints user manual"
    >
      <div className="manual-backdrop" onClick={onClose} />

      <div className="manual-dialog">
        <button ref={closeRef} type="button" className="manual-close" onClick={onClose} aria-label="Close the manual">
          <span aria-hidden="true">✕</span>
        </button>

        <div className="manual-book" data-state={state} onClick={onBookClick}>
          {sheets.map((sheet, i) => (
            <div
              key={i}
              className={cn("manual-sheet", i < state && "flipped")}
              /*
               * Two stacks coexist and they need opposite orders: leaves not yet
               * turned stack with the first on top, leaves already turned stack
               * with the last on top. The leaf mid-turn rides above both, or it
               * clips through the stack it is leaving.
               */
              style={{
                zIndex: i === turning ? 50 : i < state ? i + 1 : sheets.length - i,
              }}
            >
              <div className="sheet-face sheet-front">{sheet.front}</div>
              <div className="sheet-face sheet-back">{sheet.back}</div>
            </div>
          ))}
        </div>

        <div className="manual-controls">
          <button
            type="button"
            className="manual-nav-btn"
            onClick={() => flip(-1)}
            disabled={state === 0}
          >
            ‹ Back
          </button>
          <span className="manual-page-info">{SPREADS[state]}</span>
          <button
            type="button"
            className="manual-nav-btn"
            onClick={() => flip(1)}
            disabled={state === sheets.length}
          >
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Pages

   Sheet 1 front is the cover, sheet 1 back is page 1, sheet 2 front is page 2,
   and so on — each physical leaf carries two pages. The last sheet's back is
   the sign-off.
   ═══════════════════════════════════════════════════════════════════════════ */

function buildSheets(t: Translate) {
  return [
    { front: <Cover />, back: <PageWhatIsIt /> },
    { front: <PageScreens t={t} />, back: <PageGames t={t} /> },
    { front: <PageWrite />, back: <PageReact /> },
    { front: <PageDashboard />, back: <PageSettings /> },
    { front: <PageTips />, back: <EndPage /> },
  ];
}

/** Folio pair. Zero-padded ghost numeral, plain printed folio. */
function Folio({ n }: { n: number }) {
  return (
    <>
      <span className="m-watermark" aria-hidden="true">
        {String(n).padStart(2, "0")}
      </span>
      <span className="m-pageno">{n}</span>
    </>
  );
}

function Cover() {
  return (
    <div className="manual-cover">
      <span className="m-eyebrow">User manual</span>
      <span className="m-wordmark">
        EXP<span>oints</span>
      </span>
      <p style={{ color: "var(--color-ink-muted)", fontSize: "clamp(.72rem,1.6vw,.88rem)" }}>
        Play it. Review it. Climb the ranks.
        <br />
        Here&apos;s where everything lives.
      </p>
      <span className="m-dots">
        {Object.values(SCREEN_COLORS).map((c) => (
          <i key={c} style={{ background: c }} />
        ))}
      </span>
      <span className="m-hint">Click the page (or press Next) to open →</span>
    </div>
  );
}

function PageWhatIsIt() {
  return (
    <div className="manual-page">
      <h3>
        What is <span>EXPoints?</span>
      </h3>
      <p>
        A forum where every post is a <b>game review</b>. You write what you thought, give it a
        score out of 10, and it joins that game&apos;s page for everyone else to read.
      </p>

      <div className="m-mockcard">
        <div className="m-mock-top">
          <span className="m-mock-eyebrow">Elden Ring</span>
          <span className="m-mock-score">8</span>
        </div>
        <p className="m-mock-title">Elden Ring Review</p>
        <div className="m-mock-actions">
          <span>★ Star</span>
          <span>💬 Comment</span>
          <span>🔖 Save</span>
        </div>
      </div>

      <p>
        Every review carries a score, so each game builds a real <b>average rating</b> instead of
        a vague vibe. Writing and being starred earns EXP, which is what moves you up the ranks.
      </p>
      <Folio n={1} />
    </div>
  );
}

function PageScreens({ t }: { t: Translate }) {
  const screens = [
    { color: SCREEN_COLORS.feed, name: t("nav.feed"), body: "Everything, newest and hottest mixed together. Your home." },
    { color: SCREEN_COLORS.trending, name: t("nav.trending"), body: "The most-starred reviews. What the community rates highly." },
    { color: SCREEN_COLORS.fresh, name: t("nav.fresh"), body: "Just posted, newest first. Nothing has had time to gather stars." },
    { color: SCREEN_COLORS.games, name: t("nav.games"), body: "The catalogue. Every game, and every review of it." },
    { color: SCREEN_COLORS.ranks, name: t("nav.ranks"), body: "The leaderboard. Who is winning, by EXP, stars or reviews." },
    { color: SCREEN_COLORS.saved, name: t("nav.saved"), body: "Reviews you bookmarked. Your reading list." },
  ];

  return (
    <div className="manual-page">
      <h3>
        The six <span>screens</span>
      </h3>
      <p>
        Every screen has its own colour — the whole app repaints when you move, so you always know
        where you are.
      </p>

      <div className="m-screens">
        {screens.map((s) => (
          <div key={s.name} className="m-screen" style={{ ["--m-color" as string]: s.color }}>
            <b>{s.name}</b>
            <span>{s.body}</span>
          </div>
        ))}
      </div>

      <p>
        Feed, Trending and Fresh all show reviews — they differ only in <b>what gets to the top</b>.
      </p>
      <Folio n={2} />
    </div>
  );
}

function PageGames({ t }: { t: Translate }) {
  return (
    <div className="manual-page">
      <h3>
        Games · <span>every game&apos;s home</span>
      </h3>
      <p>
        <b>{t("nav.games")}</b> is the part people miss. Each game has its own page, and that page
        collects every review anyone has written for it.
      </p>

      <div className="m-diagram">
        <span className="m-box">
          <span className="m-ico">🔎</span>
          Find a game
        </span>
        <span className="m-arrow">→</span>
        <span className="m-box m-box-accent">
          <span className="m-ico">🎮</span>
          Its page
        </span>
        <span className="m-arrow">→</span>
        <span className="m-box">
          <span className="m-ico">📄</span>
          All reviews
        </span>
      </div>

      <p>
        Open <b>{t("nav.games")}</b>, type into <b>Find a game</b>, and click any card. You get the
        game&apos;s <b>average score</b>, its platforms, and <b>Community reviews</b> underneath.
      </p>
      <p>
        Nobody has reviewed it yet? Write the first one — naming a game that doesn&apos;t exist yet
        creates its page.
      </p>
      <Folio n={3} />
    </div>
  );
}

function PageWrite() {
  return (
    <div className="manual-page">
      <h3>
        Write a <span>review</span>
      </h3>
      <p>
        Press <b>Write</b> on the card at the top of your Feed — the one that asks what
        you&apos;re playing. On a phone it&apos;s the raised <b>Post</b> button in the bottom bar.
      </p>

      <div className="m-diagram">
        <span className="m-box">
          <span className="m-ico">🎮</span>
          Game
        </span>
        <span className="m-arrow">→</span>
        <span className="m-box">
          <span className="m-ico">✍️</span>
          Your take
        </span>
        <span className="m-arrow">→</span>
        <span className="m-box m-box-accent">
          <span className="m-ico">🔟</span>
          Score
        </span>
      </div>

      <p>
        Search for the game or type any title. Give it a <b>headline</b>, say what worked and what
        didn&apos;t, then drag the slider to score it <b>1 to 10</b>.
      </p>
      <p>
        You can attach <b>images</b> too — drop them in, or click to pick.
      </p>
      <Folio n={4} />
    </div>
  );
}

function PageReact() {
  return (
    <div className="manual-page">
      <h3>
        On every <span>review</span>
      </h3>
      <p>Three things sit at the bottom of every review card:</p>

      <ul className="m-tips">
        <li>
          <b>Star</b> it if it&apos;s good. Stars are the currency — they push a review to
          Trending and earn its author EXP.
        </li>
        <li>
          <b>Comment</b> to reply. Comments can be starred too.
        </li>
        <li>
          <b>Save</b> puts it in Saved, to read later.
        </li>
      </ul>

      <p>
        The <b>⋯</b> menu on your own reviews lets you edit or delete them. On other people&apos;s,
        it&apos;s how you report something that shouldn&apos;t be here.
      </p>
      <Folio n={5} />
    </div>
  );
}

function PageDashboard() {
  return (
    <div className="manual-page">
      <h3>
        Your <span>dashboard</span>
      </h3>
      <p>On a wide screen the browsing pages have a column either side:</p>

      <div className="m-layout">
        <span className="m-col m-col-side">Browse</span>
        <span className="m-col m-col-main">Reviews</span>
        <span className="m-col m-col-side">Your run</span>
      </div>

      <p>
        Left is <b>Browse</b> — the six screens. Right is your EXP progress, the top players and
        the most-reviewed games.
      </p>

      <div className="m-layout">
        <span className="m-col m-col-rail">▤</span>
        <span className="m-col m-col-main">Reviews</span>
        <span className="m-col m-col-rail">▤</span>
      </div>

      <p>
        Don&apos;t want them? The small <b>panel icon</b> in each card&apos;s corner folds it into
        a slim rail at the screen edge. Hover that rail and press <b>Show cards</b> to bring them
        back — or use the switches in Settings.
      </p>
      <Folio n={6} />
    </div>
  );
}

function PageSettings() {
  return (
    <div className="manual-page">
      <h3>
        Make it <span>yours</span>
      </h3>
      <p>
        The <b>gear</b> in the header opens Settings, where the app bends to suit you:
      </p>

      <div className="m-pills">
        <span className="m-pill">
          <i>◆</i> Language
        </span>
        <span className="m-pill">
          <i>◆</i> Default sort
        </span>
        <span className="m-pill">
          <i>◆</i> Reduce motion
        </span>
        <span className="m-pill">
          <i>◆</i> Effects
        </span>
        <span className="m-pill">
          <i>◆</i> Cards
        </span>
      </div>

      <p>
        Read the app in <b>English, Filipino or Spanish</b>. Pick which tab the feed opens on. Turn
        off the drifting embers and starfields if you&apos;d rather have a plain background, or stop
        animation altogether.
      </p>
      <p>
        Your avatar, banner and bio live one click further in, under <b>Profile</b>.
      </p>
      <Folio n={7} />
    </div>
  );
}

function PageTips() {
  return (
    <div className="manual-page">
      <h3>
        Handy <span>tips</span>
      </h3>
      <ul className="m-tips">
        <li>
          The <b>search bar</b> can look through titles, body text or authors — use the dropdown
          on its right to pick which.
        </li>
        <li>
          On <b>Ranks</b>, the three tabs re-sort the whole board by <b>EXP</b>, <b>stars</b> or{" "}
          <b>reviews</b>.
        </li>
        <li>
          The <b>bell</b> collects every star, comment and reply you get. The number is what
          you haven&apos;t read.
        </li>
        <li>
          Your profile can <b>pin up to three reviews</b> to the top — your best work first.
        </li>
        <li>
          Changing your <b>username</b> changes your profile link, and old links stop working.
        </li>
      </ul>
      <Folio n={8} />
    </div>
  );
}

function EndPage() {
  return (
    <div className="manual-endpage">
      <h3 style={{ margin: 0 }}>
        That&apos;s the <span>whole book</span>
      </h3>
      <p style={{ color: "var(--color-ink-muted)", fontSize: "clamp(.74rem,1.6vw,.88rem)", lineHeight: 1.55 }}>
        Close it and go read something. If you get lost, the manual is always in the header — and
        every screen tells you where you are by the colour it wears.
      </p>
      <span className="m-credit">
        Made by Team VERPTO
        <br />
        Jashmine · Eijay · Lord Christian
      </span>
    </div>
  );
}
