import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  Flame,
  Gamepad2,
  MessageSquare,
  Search,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { BoxArtRail } from "@/components/landing/BoxArtRail";
import { DevCard, type Dev } from "@/components/landing/DevCard";
import { Marquee } from "@/components/landing/Marquee";
import { GlyphField } from "@/components/ui/Glyphs";
import { Logo } from "@/components/ui/Logo";
import { EXP_REWARDS, RANKS } from "@/lib/exp";
import { getCurrentProfile, getGames, getTopPlayers } from "@/lib/queries";
import { Avatar } from "@/components/ui/Avatar";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { compactNumber } from "@/lib/utils";

// Rendered per request: it reads the session cookie to swap the CTA between
// "Sign up" and "Enter forum". The three data queries below run in parallel, so
// this stays a single round-trip's worth of latency.

/**
 * The team.
 *
 * `focus` names work that visibly exists in this repo, so the roles read as
 * real rather than as filler. Accent colours are drawn from the site palette
 * and kept distinct per person.
 */
const TEAM: Dev[] = [
  {
    name: "Jashmine Verdida",
    role: "Frontend Engineer & QA",
    focus:
      "Built the interface and design system — the EXP bar, rank tiers and themed atmospheres — and tested the whole thing to breaking point.",
    email: "jashmineverdida08@gmail.com",
    linkedin: "https://www.linkedin.com/in/jashmine-verdida-820a56352/",
    photo: "/team/jashmine.webp",
    accent: "#f43f5e",
    accentSoft: "#fda4af",
  },
  {
    name: "Eijay P. Pepito",
    role: "Backend & Database Engineer",
    focus:
      "Designed the Postgres schema, the trigger-driven EXP economy and the row-level security that keeps it honest.",
    email: "eijay.pepito8@gmail.com",
    linkedin: "https://www.linkedin.com/in/eijay-pepito-98b538355/",
    photo: "/team/eijay.webp",
    accent: "#38bdf8",
    accentSoft: "#a5f3fc",
  },
  {
    name: "Lord Christian Beligaño",
    role: "AI & Systems Engineer",
    focus:
      "Owns the ranking algorithm, search relevance and the moderation tooling that keeps the forum civil.",
    email: "lordchristian88@gmail.com",
    linkedin: "https://www.linkedin.com/in/beliga%C3%B1o-lord-christian-64484524a/",
    photo: "/team/lord.webp",
    accent: "#a78bfa",
    accentSoft: "#ddd6fe",
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: "EXP for everything",
    body: "Post, comment, get starred. Every contribution moves a bar you can actually see. No invisible karma.",
  },
  {
    icon: TrendingUp,
    title: "Level up, get seen",
    body: "Your level feeds directly into ranking. Climb high enough and your reviews land on the front page.",
  },
  {
    icon: Star,
    title: "Reviews with a score",
    body: "Every review carries a 1–10 verdict, so games build a real aggregate rating instead of vibes.",
  },
  {
    icon: Shield,
    title: "Actually moderated",
    body: "Admins hide bad posts and ban bad actors. Reports go to a real queue, not a void.",
  },
  {
    icon: Search,
    title: "Search that works",
    body: "Filter by title, author or body text. Fuzzy matching finds the thread you half-remember.",
  },
  {
    icon: Bookmark,
    title: "Save for later",
    body: "Bookmark any review. Your reading list follows you across every device.",
  },
];

export default async function LandingPage() {
  // All three run in parallel — the page waits on the slowest, not the sum.
  const [profile, games, topPlayers] = await Promise.all([
    getCurrentProfile(),
    getGames(),
    getTopPlayers(5),
  ]);

  const gameTitles = games.length
    ? games.map((g) => g.name)
    : ["Elden Ring", "Baldur's Gate 3", "Hollow Knight: Silksong", "Balatro", "Persona 5 Royal"];

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      {/* Film grain over the whole page for depth. */}
      <div className="grain-overlay" aria-hidden="true" />

      {/* The signature vertical box-art strip, restored. Fixed to the right
          edge; hidden below xl where there isn't room beside the content. */}
      <BoxArtRail />

      {/* Content sits inside a right gutter on xl so nothing collides with the
          rail. */}
      <div className="xl:pr-[200px]">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="relative z-30">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" aria-label="EXPoints home">
            <Logo className="text-xl sm:text-2xl" />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-semibold text-ink-muted transition-colors hover:text-ink">
              Features
            </a>
            <a href="#exp" className="text-sm font-semibold text-ink-muted transition-colors hover:text-ink">
              EXP System
            </a>
            <a href="#ranks" className="text-sm font-semibold text-ink-muted transition-colors hover:text-ink">
              Ranks
            </a>
            <Link href="/discover" className="text-sm font-semibold text-ink-muted transition-colors hover:text-ink">
              Discover
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            {profile ? (
              <Link
                href="/feed"
                className="btn-primary inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm sm:px-5"
              >
                Enter forum
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden h-10 items-center rounded-xl px-4 text-sm font-semibold text-ink-muted transition-colors hover:text-ink sm:inline-flex"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="btn-primary inline-flex h-10 items-center rounded-xl px-4 text-sm sm:px-5"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative">
        <GlyphField density="rich" />

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-6 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-24 lg:pt-10">
          {/* Copy first in DOM so mobile reads the pitch before the art. */}
          <div className="relative z-10 order-2 text-center lg:order-1 lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-pill border border-brand-400/30 bg-brand-500/12 px-3.5 py-1.5 text-[0.72rem] font-bold uppercase tracking-widest text-brand-200">
              <Sparkles className="h-3.5 w-3.5" />
              The gamer forum with a progress bar
            </span>

            {/*
              One animated gradient on the primary statement, one solid accent
              colour on the payoff line. The earlier version stacked three
              gradient treatments, which fought each other and read as noise.
            */}
            <h1 className="mt-5 font-display text-[2.1rem] font-extrabold leading-[1.06] tracking-[-0.02em] sm:text-5xl lg:text-[3.35rem]">
              <span className="text-gradient">Read the most trusted reviews online.</span>{" "}
              <span className="text-exp">Then earn your rank.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-[0.98rem] leading-relaxed text-ink-muted lg:mx-0 sm:text-lg">
              EXPoints is where gamers write reviews worth reading. Every post, comment and star
              you earn feeds a real levelling system — climb it and your takes hit the front page.
              Other forums are grey walls of text. This one fights back.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href={profile ? "/feed" : "/register"}
                className="btn-primary inline-flex h-14 items-center justify-center gap-2 rounded-2xl px-8 font-display text-[0.95rem] uppercase tracking-widest"
              >
                {profile ? "Back to the feed" : "Start at Level 1"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/discover"
                className="btn-ghost inline-flex h-14 items-center justify-center gap-2 rounded-2xl px-8 font-display text-[0.95rem] uppercase tracking-widest"
              >
                <Gamepad2 className="h-4 w-4" />
                Browse reviews
              </Link>
            </div>

          </div>

          {/* Panda mascot — the piece of EXPoints nobody would recognise it without. */}
          <div className="relative order-1 flex justify-center lg:order-2">
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 blur-3xl"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(56,160,255,0.42), transparent 72%)",
              }}
            />
            <Image
              src="/brand/panda-hero.png"
              alt="The EXPoints panda, sitting in an armchair with a controller"
              width={560}
              height={560}
              priority
              className="animate-float w-[min(78vw,26rem)] drop-shadow-[0_24px_60px_rgba(0,0,0,0.6)] lg:w-[min(42vw,32rem)]"
            />
          </div>
        </div>

        {/* Game ticker — real titles pulled from the catalogue. */}
        <div className="relative z-10 space-y-3 pb-14">
          <Marquee items={gameTitles} />
          <Marquee items={[...gameTitles].reverse()} reverse />
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="relative mx-auto max-w-7xl scroll-mt-20 px-5 py-16 sm:px-8 lg:py-24">
        <GlyphField density="light" className="opacity-60" />
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="rule-label justify-center before:hidden after:hidden">What you get</h2>
          <p className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            <span className="text-gradient">Built for people who actually play games</span>
          </p>
          <p className="mt-3 text-ink-muted">
            Every feature exists because a bland forum was missing it.
          </p>
        </div>

        <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="glass card-interactive rounded-3xl p-6">
              <span className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-400/25">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="font-display text-lg font-bold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── EXP explainer ───────────────────────────────────────────────── */}
      <section id="exp" className="relative mx-auto max-w-7xl scroll-mt-20 px-5 py-16 sm:px-8 lg:py-24">
        <div className="glass-strong relative overflow-hidden rounded-[2rem] p-7 sm:p-11">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-exp/12 blur-3xl"
          />

          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="rule-label">The EXP system</h2>
              <p className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                <span className="text-gradient-exp">Every action pays out.</span>
              </p>
              <p className="mt-4 leading-relaxed text-ink-muted">
                No hidden formula. Contribute, get EXP, level up. Level 2 costs 50 EXP; every level
                after that costs a little more, so the climb stays meaningful all the way to
                Legend.
              </p>

              <ul className="mt-7 space-y-2.5">
                {[
                  { label: "Publish a review", exp: EXP_REWARDS.post_created, icon: MessageSquare },
                  { label: "Leave a comment", exp: EXP_REWARDS.comment_created, icon: MessageSquare },
                  { label: "Your review gets starred", exp: EXP_REWARDS.post_star_received, icon: Star },
                  { label: "Your comment gets starred", exp: EXP_REWARDS.comment_star_received, icon: Star },
                ].map(({ label, exp, icon: Icon }) => (
                  <li
                    key={label}
                    className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-exp" />
                    <span className="flex-1 text-sm text-ink-muted">{label}</span>
                    <span className="stat shrink-0 font-bold text-exp">+{exp} EXP</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Live top-players board — social proof that the system is running. */}
            <div className="rounded-3xl border border-white/10 bg-abyss/45 p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <Flame className="h-4 w-4 text-exp" />
                <h3 className="font-display text-sm font-bold uppercase tracking-widest text-ink-muted">
                  Top of the leaderboard
                </h3>
              </div>

              {topPlayers.length > 0 ? (
                <ol className="space-y-2">
                  {topPlayers.map((player, i) => (
                    <li
                      key={player.id}
                      className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5"
                    >
                      <span
                        className={`stat w-6 shrink-0 text-center text-sm font-bold ${
                          i === 0 ? "text-exp" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-ink-faint"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <Avatar
                        username={player.username}
                        avatarUrl={player.avatar_url}
                        level={player.level}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                        @{player.username}
                      </span>
                      <LevelBadge level={player.level} />
                      <span className="stat hidden shrink-0 text-xs text-exp sm:block">
                        {compactNumber(player.exp)}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="py-8 text-center text-sm text-ink-faint">
                  The board is empty. Sign up and you&apos;re instantly #1.
                </p>
              )}

              <Link
                href="/leaderboard"
                className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-300 transition-colors hover:text-brand-200"
              >
                See the full leaderboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ranks ───────────────────────────────────────────────────────── */}
      <section id="ranks" className="relative mx-auto max-w-7xl scroll-mt-20 px-5 py-16 sm:px-8 lg:py-24">
        <GlyphField density="light" className="opacity-60" />

        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="rule-label justify-center after:hidden">Six tiers</h2>
          <p className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            <span className="text-gradient">From Rookie to Legend</span>
          </p>
          <p className="mt-3 text-ink-muted">
            Your tier colours your badge, your avatar ring and your name across the whole forum.
          </p>
        </div>

        <div className="mt-11 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RANKS.map((rank) => (
            <div
              key={rank.name}
              className="card-interactive relative overflow-hidden rounded-3xl border p-6"
              style={{
                borderColor: `${rank.accent}40`,
                background: `linear-gradient(150deg, ${rank.accent}14, rgba(5,11,30,0.72))`,
              }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl"
                style={{ background: rank.glow }}
              />
              <div className="relative">
                <span
                  className="inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 font-display text-[0.65rem] font-bold uppercase tracking-widest"
                  style={{
                    color: rank.accent,
                    borderColor: `${rank.accent}55`,
                    background: `${rank.accent}18`,
                  }}
                >
                  <BadgeCheck className="h-3 w-3" />
                  Lv.{rank.minLevel}+
                </span>
                <h3
                  className="mt-3 font-display text-2xl font-extrabold"
                  style={{ color: rank.accent }}
                >
                  {rank.name}
                </h3>
                <p className="mt-1 text-sm text-ink-muted">
                  {rank.minLevel === 1
                    ? "Everyone starts here."
                    : `Reach Level ${rank.minLevel} to unlock this tier.`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Devs ────────────────────────────────────────────────────────── */}
      <section id="team" className="relative mx-auto max-w-7xl scroll-mt-20 px-5 py-16 sm:px-8">
        <GlyphField density="light" className="opacity-50" />

        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="rule-label justify-center before:hidden after:hidden">Meet the devs</h2>
          <p className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            <span className="text-gradient">Three people who were tired of bland forums</span>
          </p>
          <p className="mt-3 text-ink-muted">
            Built end to end — interface, database and the systems in between.
          </p>
        </div>

        {/* gap-y is generous because each card's portrait overhangs upward by
            7rem — a tight gap would let one card's head collide with the card
            above it once the grid wraps to two columns. */}
        <div className="relative grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((dev) => (
            <DevCard key={dev.name} dev={dev} />
          ))}
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-4xl px-5 pb-24 pt-8 text-center sm:px-8">
        <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-5xl">
          <span className="text-gradient">Your first review is worth</span>{" "}
          <span className="text-gradient-exp">{EXP_REWARDS.post_created} EXP.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-ink-muted">
          Free, takes a minute, and you start climbing immediately.
        </p>
        <Link
          href={profile ? "/feed" : "/register"}
          className="btn-primary mt-8 inline-flex h-14 items-center gap-2 rounded-2xl px-9 font-display text-[0.95rem] uppercase tracking-widest"
        >
          {profile ? "Go to the feed" : "Create your account"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/8 px-5 py-9 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-sm text-ink-faint sm:flex-row">
          <Logo className="text-base" />
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/discover" className="transition-colors hover:text-ink">Discover</Link>
            <Link href="/games" className="transition-colors hover:text-ink">Games</Link>
            <Link href="/leaderboard" className="transition-colors hover:text-ink">Leaderboard</Link>
            <Link href="/login" className="transition-colors hover:text-ink">Log in</Link>
          </nav>
          <p>© {new Date().getFullYear()} EXPoints</p>
        </div>
      </footer>
      </div>
    </div>
  );
}
