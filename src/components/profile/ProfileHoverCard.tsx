"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { ExpBar } from "@/components/ui/ExpBar";
import { AdminBadge, LevelBadge } from "@/components/ui/LevelBadge";
import { useT } from "@/components/shell/PrefsProvider";
import type { UserRole } from "@/lib/types";
import { compactNumber } from "@/lib/utils";

interface CardProfile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string;
  level: number;
  exp: number;
  post_count: number;
  comment_count: number;
  stars_received: number;
  role: UserRole;
}

/**
 * Fetched once per username per page load.
 *
 * Module-level on purpose: the same author shows up on half the cards in a
 * feed, and a Map keyed by handle means hovering four of their posts costs one
 * request instead of four. In-flight promises are cached too, so hovering twice
 * before the first response lands doesn't fire a second.
 */
const cache = new Map<string, Promise<CardProfile | null>>();

function loadProfile(username: string) {
  const existing = cache.get(username);
  if (existing) return existing;

  const request = fetch(`/api/profile-card?username=${encodeURIComponent(username)}`)
    .then((r) => (r.ok ? (r.json() as Promise<CardProfile>) : null))
    .catch(() => null);

  cache.set(username, request);
  return request;
}

/** Long enough that skimming a feed doesn't fire cards; short enough to feel instant when meant. */
const OPEN_DELAY = 300;
const CARD_WIDTH = 300;

/**
 * A peek at whoever wrote the thing you're reading — avatar, banner, level, EXP
 * and their totals — without leaving the page.
 *
 * WHY IT IS PORTALLED AND NOT INTERACTIVE
 * Two constraints decided the design. Post cards and leaderboard rows are
 * wrapped in links, and putting focusable content inside an anchor is invalid
 * markup that keyboards and screen readers both handle badly. And the cards
 * themselves clip their contents to round their corners, which would slice a
 * card anchored inside one.
 *
 * So it renders into <body> at fixed coordinates measured from the trigger, and
 * it takes no pointer events at all. Nothing to clip it, nothing to nest, and
 * no grace period needed for the pointer travelling onto it — because it never
 * has to.
 */
export function ProfileHoverCard({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  const t = useT();
  const reduce = useReducedMotion();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | undefined>(undefined);
  /** Whether the pointer is still on the trigger. Read after the fetch. */
  const hovering = useRef(false);

  const [profile, setProfile] = useState<CardProfile | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const close = useCallback(() => {
    hovering.current = false;
    window.clearTimeout(timer.current);
    setPosition(null);
  }, []);

  const open = useCallback(() => {
    hovering.current = true;
    window.clearTimeout(timer.current);

    /*
     * The request starts NOW, not when the delay elapses.
     *
     * It used to be fired inside the timeout, so the first hover on a fresh
     * page cost the delay AND a round trip end to end — which is why the card
     * felt like it wasn't working and then arrived late. Kicking it off here
     * lets the network overlap the delay, and by the time the delay is up the
     * response is usually already sitting in the cache.
     */
    const pending = loadProfile(username);

    timer.current = window.setTimeout(async () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const data = await pending;

      /*
       * THE STRANDED-CARD GUARD.
       *
       * Clearing the timeout does nothing once it has already fired — the async
       * callback is past that point and still holding a promise. So a pointer
       * that moved on during the fetch used to get a card anyway, appearing
       * somewhere it was no longer hovering, with no mouseleave left to come
       * and dismiss it. That is how two of them ended up stacked on screen with
       * no way to clear them short of a reload.
       */
      if (!hovering.current || !data) return;

      // Measured after the fetch, so a page that scrolled while the request was
      // in flight still places the card against where the avatar is now.
      let rect = anchor.getBoundingClientRect();

      /*
       * Belt and braces for a zero-sized anchor.
       *
       * An element that generates no box — `display: contents`, which this
       * wrapper used to use — reports a rect of all zeros, and the card lands
       * in the top-left corner of the window instead of beside the avatar. The
       * wrapper is a real inline-flex box now, so this shouldn't fire; it stays
       * because the failure is silent and looks like a positioning bug rather
       * than a measurement one.
       */
      if (!rect.width && !rect.height && anchor.firstElementChild) {
        rect = anchor.firstElementChild.getBoundingClientRect();
      }
      const left = Math.min(
        Math.max(12, rect.left + rect.width / 2 - CARD_WIDTH / 2),
        window.innerWidth - CARD_WIDTH - 12,
      );

      // Below the avatar normally; above it when there isn't room, so the card
      // never hangs off the bottom of the window.
      const below = rect.bottom + 10;
      const flip = below + 260 > window.innerHeight && rect.top > 280;

      setProfile(data);
      setPosition({ top: flip ? rect.top - 270 : below, left });
    }, OPEN_DELAY);
  }, [username]);

  // A hover that outlives its trigger would strand the card on screen.
  useEffect(() => () => window.clearTimeout(timer.current), []);

  /*
   * Scrolling or resizing dismisses it.
   *
   * The card is fixed-positioned against coordinates measured once, so the page
   * moving underneath leaves it pointing at nothing. Capture phase, because the
   * dock columns scroll inside themselves and those events never reach the
   * window otherwise.
   */
  useEffect(() => {
    if (!position) return;
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [position, close]);

  return (
    <>
      {/*
        A real box, not `display: contents`.

        `contents` was the tidy choice — no extra element in the flex row — but
        an element that generates no box cannot be measured, and the card has to
        be placed against the avatar. Both call sites put this straight into a
        flex row where the avatar was already `shrink-0`, so an inline-flex
        wrapper carrying the same rule sits exactly where the avatar did.
      */}
      <span
        ref={anchorRef}
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
        className="inline-flex shrink-0"
      >
        {children}
      </span>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {position && profile && (
              <motion.div
                key="hover-card"
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={reduce ? { duration: 0 } : { duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                style={{ top: position.top, left: position.left, width: CARD_WIDTH }}
                className="popover pointer-events-none fixed z-80 overflow-hidden rounded-2xl"
              >
                {/* Banner strip. Falls back to a brand wash rather than blank
                    space — an empty band reads as a loading bug. */}
                <div
                  className="h-16 w-full bg-gradient-to-br from-brand-500/40 via-brand-700/30 to-transparent bg-cover bg-center"
                  style={
                    profile.banner_url ? { backgroundImage: `url(${profile.banner_url})` } : undefined
                  }
                />

                <div className="px-4 pb-4">
                  {/* Lifted so it overlaps the banner, the way a profile header does. */}
                  <div className="-mt-7 flex items-end justify-between gap-2">
                    <Avatar
                      username={profile.username}
                      avatarUrl={profile.avatar_url}
                      level={profile.level}
                      size="lg"
                    />
                    <span className="flex items-center gap-1.5 pb-1">
                      {profile.role === "admin" && <AdminBadge />}
                      <LevelBadge level={profile.level} showRank />
                    </span>
                  </div>

                  <p className="mt-2 truncate font-display font-bold text-ink">
                    {profile.display_name || profile.username}
                  </p>
                  <p className="truncate text-xs text-ink-faint">@{profile.username}</p>

                  {profile.bio && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-muted">
                      {profile.bio}
                    </p>
                  )}

                  <div className="mt-3">
                    <ExpBar exp={profile.exp} />
                  </div>

                  <dl className="mt-3 grid grid-cols-3 gap-1.5 text-center">
                    {[
                      { label: t("rail.reviews"), value: profile.post_count },
                      { label: t("rail.comments"), value: profile.comment_count },
                      { label: t("rail.stars"), value: profile.stars_received },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-lg bg-white/4 py-1.5">
                        <dd className="stat text-sm font-bold text-ink">
                          {compactNumber(stat.value)}
                        </dd>
                        <dt className="text-[0.55rem] uppercase tracking-widest text-ink-faint">
                          {stat.label}
                        </dt>
                      </div>
                    ))}
                  </dl>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
