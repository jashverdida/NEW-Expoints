"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Cake,
  Clock,
  Flame,
  Gamepad2,
  Gavel,
  Ghost,
  Heart,
  Map as MapIcon,
  Megaphone,
  MessageSquare,
  Rocket,
  Shield,
  Skull,
  Sparkles,
  Star,
  Sun,
  Sword,
  Swords,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ExpBar } from "@/components/ui/ExpBar";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { levelProgress, rankForLevel } from "@/lib/exp";
import {
  FIRST_RUN,
  type Greeting,
  type GreetingIcon,
  hailNeedsComma,
  pickGreeting,
} from "@/lib/greetings";
import type { Profile } from "@/lib/types";
import { compactNumber } from "@/lib/utils";

const ICONS: Record<GreetingIcon, React.ElementType> = {
  sword: Sword,
  swords: Swords,
  clock: Clock,
  zap: Zap,
  flame: Flame,
  gamepad: Gamepad2,
  sun: Sun,
  cake: Cake,
  sparkles: Sparkles,
  skull: Skull,
  gavel: Gavel,
  rocket: Rocket,
  trophy: Trophy,
  map: MapIcon,
  shield: Shield,
  heart: Heart,
  ghost: Ghost,
  megaphone: Megaphone,
  star: Star,
};

/** How long the modal sits there before dismissing itself. */
const DWELL_MS = 11_000;

/**
 * The "welcome back" moment, shown once per sign-in.
 *
 * TRIGGER
 * `signIn` redirects to `…?welcome=1`, and this reads that flag from the URL
 * and immediately strips it via replaceState. That's deliberately narrower than
 * a sessionStorage check: the flag can only exist directly after a successful
 * password sign-in, so the modal never ambushes someone who just opened a
 * second tab or refreshed the feed.
 *
 * The greeting itself is picked on the client, after mount — the markup the
 * server renders is empty, so a random pick can't cause a hydration mismatch.
 */
export function WelcomeBack({ profile }: { profile: Profile }) {
  const [greeting, setGreeting] = useState<Greeting | null>(null);
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [stamp, setStamp] = useState("");
  const dismissRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setGreeting(null), []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const flag = url.searchParams.get("welcome");
    if (flag !== "1" && flag !== "new") return;

    // Drop the flag before anything else, so a refresh or a shared link can't
    // replay the modal.
    url.searchParams.delete("welcome");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);

    setStamp(
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).toUpperCase(),
    );
    // `new` comes from signUp — a fresh account gets first-run copy rather than
    // being welcomed "back" to somewhere it has never been.
    setIsFirstRun(flag === "new");
    setGreeting(flag === "new" ? FIRST_RUN : pickGreeting());
  }, []);

  // Dismisses itself. This is a flourish, not a task — leaving it parked over
  // the feed until someone deals with it would make it an obstacle.
  useEffect(() => {
    if (!greeting) return;
    const timer = window.setTimeout(close, DWELL_MS);
    return () => window.clearTimeout(timer);
  }, [greeting, close]);

  useEffect(() => {
    if (!greeting) return;
    dismissRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [greeting, close]);

  // Burst geometry. Client-only (the modal never renders on the server), so
  // Math.random is safe here — no markup to match.
  const sparks = useMemo(
    () =>
      Array.from({ length: 34 }, () => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 130 + Math.random() * 280;
        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance * 0.8,
          size: 3 + Math.random() * 6,
          delay: Math.random() * 0.35,
          duration: 1 + Math.random() * 0.9,
          gold: Math.random() > 0.45,
        };
      }),
    [],
  );

  const rank = rankForLevel(profile.level);
  const progress = levelProgress(profile.exp);
  const Icon = greeting ? ICONS[greeting.icon] : Sparkles;

  const stats = [
    { label: "Reviews", value: profile.post_count, icon: Gamepad2 },
    { label: "Stars", value: profile.stars_received, icon: Star },
    { label: "Comments", value: profile.comment_count, icon: MessageSquare },
  ];

  return (
    <AnimatePresence>
      {greeting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[110] grid place-items-center bg-abyss/70 px-4 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-hail"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          {/* Rank-coloured bloom behind everything. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[120px]"
            style={{ background: rank.accent }}
          />

          {/* Confetti burst, thrown from the middle of the card. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-1/2">
              {sparks.map((s, i) => (
                <span
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: s.size,
                    height: s.size,
                    background: s.gold ? "#fbbf24" : rank.accent,
                    boxShadow: `0 0 12px 2px ${s.gold ? "rgba(251,191,36,0.7)" : rank.glow}`,
                    ["--burst-x" as string]: `${s.x}px`,
                    ["--burst-y" as string]: `${s.y}px`,
                    animation: `welcome-burst ${s.duration}s cubic-bezier(0.12, 0.8, 0.3, 1) ${s.delay}s both`,
                  }}
                />
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 34, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="relative w-full max-w-lg"
          >
            {/* Rotating rim light in the user's rank colour. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-px overflow-hidden rounded-[1.6rem] opacity-80"
            >
              <span
                className="absolute left-1/2 top-1/2 aspect-square h-[180%] -translate-x-1/2 -translate-y-1/2"
                style={{
                  background: `conic-gradient(from 0deg, transparent 0deg, ${rank.accent} 40deg, #fbbf24 75deg, transparent 130deg, transparent 210deg, ${rank.accent} 250deg, transparent 320deg)`,
                  animation: "rim-spin 8s linear infinite",
                }}
              />
            </div>

            <div
              className="popover relative overflow-hidden rounded-3xl"
              style={{ boxShadow: `0 30px 90px -30px ${rank.glow}, 0 0 0 1px ${rank.accent}30` }}
            >
              {/* Accent along the top edge, plus a one-off sheen across the
                  whole panel as it lands. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1"
                style={{
                  background: `linear-gradient(90deg, transparent, ${rank.accent}, #fbbf24, transparent)`,
                }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/12 to-transparent"
                style={{ animation: "welcome-sheen 1.5s ease-out 0.35s both" }}
              />

              {/* HUD corner brackets. */}
              {[
                "left-3 top-4 border-l-2 border-t-2",
                "right-3 top-4 border-r-2 border-t-2",
                "bottom-4 left-3 border-b-2 border-l-2",
                "bottom-4 right-3 border-b-2 border-r-2",
              ].map((corner) => (
                <span
                  key={corner}
                  aria-hidden="true"
                  className={`pointer-events-none absolute h-4 w-4 ${corner}`}
                  style={{ borderColor: `${rank.accent}66` }}
                />
              ))}

              <button
                type="button"
                onClick={close}
                aria-label="Dismiss"
                className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-white/8 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative px-6 py-8 text-center sm:px-9">
                {/* Boot-sequence kicker. */}
                <p className="mb-6 flex items-center justify-center gap-2 font-display text-[0.62rem] font-bold uppercase tracking-[0.3em] text-ink-faint">
                  <Icon className="h-3.5 w-3.5" style={{ color: rank.accent }} />
                  {isFirstRun ? "Save file created" : "Save file loaded"}
                  {stamp && <span className="stat tracking-normal">· {stamp}</span>}
                </p>

                {/* Avatar with expanding rank-coloured rings. */}
                <div className="relative mx-auto mb-5 grid h-28 w-28 place-items-center">
                  {[0, 1.2].map((delay) => (
                    <span
                      key={delay}
                      aria-hidden="true"
                      className="absolute inset-1 rounded-full border-2"
                      style={{
                        borderColor: `${rank.accent}88`,
                        animation: `welcome-ring 2.8s ease-out ${delay}s infinite`,
                      }}
                    />
                  ))}
                  <Avatar
                    username={profile.username}
                    avatarUrl={profile.avatar_url}
                    level={profile.level}
                    size="xl"
                    className="relative"
                  />
                </div>

                <h2
                  id="welcome-hail"
                  className="font-display text-xl font-extrabold leading-tight tracking-tight text-ink sm:text-2xl"
                >
                  {greeting.hail}
                  {hailNeedsComma(greeting.hail) && ","}
                </h2>

                <p
                  className="text-gradient font-display text-[2.15rem] font-extrabold leading-none tracking-tight sm:text-[2.75rem]"
                  /* Both animations restated: an inline `animation` replaces the
                     shorthand `.text-gradient` sets, so naming only the entrance
                     would silently kill the shimmer. */
                  style={{
                    animation:
                      "welcome-name 0.7s var(--ease-spring) 0.15s both, text-shimmer 11s linear infinite",
                  }}
                >
                  @{profile.username}
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <LevelBadge level={profile.level} showRank size="md" />
                  <span className="stat rounded-pill border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[0.7rem] text-ink-muted">
                    {compactNumber(progress.remaining)} EXP to Lv.{progress.level + 1}
                  </span>
                </div>

                {/* The reference. */}
                <figure
                  className="mt-6 rounded-2xl border px-4 py-4"
                  style={{ borderColor: `${rank.accent}33`, background: `${rank.accent}0f` }}
                >
                  <blockquote className="text-sm leading-relaxed text-ink">
                    “{greeting.line}”
                  </blockquote>
                  <figcaption className="mt-2 font-display text-[0.62rem] font-bold uppercase tracking-[0.2em] text-ink-faint">
                    — {greeting.source}
                  </figcaption>
                </figure>

                <ExpBar exp={profile.exp} className="mt-6" />

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {stats.map((stat, i) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-white/8 bg-white/[0.03] px-2 py-3"
                      style={{ animation: `rise 0.5s var(--ease-out-expo) ${0.3 + i * 0.08}s both` }}
                    >
                      <stat.icon className="mx-auto mb-1 h-3.5 w-3.5 text-ink-faint" />
                      <p className="stat text-lg font-bold leading-none text-ink">
                        {compactNumber(stat.value)}
                      </p>
                      <p className="mt-1 font-display text-[0.58rem] font-bold uppercase tracking-widest text-ink-faint">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  ref={dismissRef}
                  type="button"
                  onClick={close}
                  className="btn-primary mt-6 h-12 w-full rounded-xl font-display text-sm uppercase tracking-[0.16em]"
                >
                  Press start
                </button>
                <p className="mt-2.5 text-[0.68rem] text-ink-faint">
                  Enter or Esc to dismiss — closes on its own shortly.
                </p>
              </div>

              {/* Dwell timer, so the auto-dismiss is visible rather than the
                  modal just vanishing mid-read. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-0.5 origin-left"
                style={{
                  background: `linear-gradient(90deg, ${rank.accent}, #fbbf24)`,
                  animation: `welcome-dwell ${DWELL_MS}ms linear both`,
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
