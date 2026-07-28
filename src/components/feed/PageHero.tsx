"use client";

import { GlyphField } from "@/components/ui/Glyphs";
import { CountUp } from "@/components/landing/CountUp";
import { cn } from "@/lib/utils";

/**
 * The big themed banner from the original Fresh Content / Trending Now pages.
 *
 * Each page gets its own accent colour with a radial bloom, drifting glyphs, a
 * sweeping sheen and counters that animate up from zero. The original build's
 * personality lived in these headers, so this leans into it rather than
 * settling for a tasteful heading.
 */
export function PageHero({
  icon,
  title,
  subtitle,
  accent,
  accentSoft,
  stats,
  className,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  /** Primary accent, e.g. "#c084fc". */
  accent: string;
  /** Secondary stop for the title gradient. */
  accentSoft: string;
  stats?: { label: string; value: number }[];
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-3xl border px-5 py-11 text-center sm:py-14",
        className,
      )}
      style={{
        borderColor: `${accent}33`,
        background: `linear-gradient(180deg, ${accent}22 0%, rgba(5,11,30,0.35) 60%, transparent 100%)`,
        boxShadow: `0 24px 70px -30px ${accent}aa, inset 0 1px 0 0 rgba(255,255,255,0.07)`,
      }}
    >
      {/* Radial bloom behind the title. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(circle at 50% -10%, ${accent}4d, transparent 65%)` }}
      />

      {/* Accent-tinted glyphs drifting inside the banner. */}
      <div className="pointer-events-none absolute inset-0" style={{ color: accent }}>
        <GlyphField density="light" edgeBias className="opacity-40" />
      </div>

      {/* Slow sheen sweeping across the panel. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-12"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}26, transparent)`,
          animation: "hero-sheen 7s ease-in-out infinite",
        }}
      />

      <div className="relative">
        <div
          className="mx-auto mb-4 grid h-16 w-16 place-items-center text-[3.25rem] leading-none"
          style={{
            filter: `drop-shadow(0 0 24px ${accent})`,
            animation: "hero-icon 3.5s ease-in-out infinite",
          }}
        >
          {icon}
        </div>

        <h1
          className="font-display text-[2rem] font-extrabold uppercase leading-none tracking-tight sm:text-5xl"
          style={{
            background: `linear-gradient(110deg, ${accentSoft}, #ffffff 35%, ${accent} 60%, ${accentSoft})`,
            backgroundSize: "220% auto",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "text-shimmer 6s linear infinite",
          }}
        >
          {title}
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm text-ink-muted sm:text-base">{subtitle}</p>

        {children && <div className="mt-6">{children}</div>}
      </div>

      {stats && stats.length > 0 && (
        <dl
          className={cn(
            "relative mx-auto mt-8 grid max-w-lg gap-3",
            stats.length === 2 ? "grid-cols-2" : "grid-cols-3",
          )}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border px-3 py-3.5 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5"
              style={{
                borderColor: `${accent}2e`,
                background: `linear-gradient(160deg, ${accent}1a, rgba(255,255,255,0.03))`,
              }}
            >
              <dd
                className="stat text-2xl font-extrabold sm:text-3xl"
                style={{ color: accent, textShadow: `0 0 22px ${accent}80` }}
              >
                <CountUp value={stat.value} />
              </dd>
              <dt className="mt-0.5 text-[0.6rem] font-semibold uppercase tracking-widest text-ink-faint">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}
