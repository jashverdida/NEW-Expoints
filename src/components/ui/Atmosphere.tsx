"use client";

import { useMemo } from "react";
import { GlyphField } from "@/components/ui/Glyphs";

/**
 * Full-viewport themed backgrounds.
 *
 * Each page gets an atmosphere that fills the entire screen rather than living
 * inside a hero card — the earlier version kept all the personality boxed into
 * one panel while the rest of the page stayed flat.
 *
 * Everything is fixed-position, -z-10 and pointer-events-none, so it sits
 * behind content and never intercepts clicks. All values are quantised and
 * seeded (never Math.random) so server and client render byte-identical markup;
 * un-rounded floats here previously caused hydration errors.
 */

export type AtmosphereTheme = "glyphs" | "starfield" | "embers" | "gold" | "library";

/** Deterministic noise — same output on server and client. */
function seeded(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}
const q = (n: number, d = 2) => Number(n.toFixed(d));

/* ── Night sky: dense stars + occasional shooting star ────────────────────── */
function Starfield() {
  const stars = useMemo(
    () =>
      Array.from({ length: 190 }, (_, i) => ({
        left: q(seeded(i, 1) * 100),
        top: q(seeded(i, 2) * 100),
        size: q(1 + seeded(i, 3) * 2.6, 1),
        duration: q(2.5 + seeded(i, 4) * 4),
        delay: q(seeded(i, 5) * 6),
        bright: seeded(i, 6) > 0.78,
      })),
    [],
  );

  // Long, staggered delays so a streak feels like a rare event, not a loop.
  const shooting = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        left: q(6 + seeded(i, 21) * 60),
        top: q(seeded(i, 22) * 55),
        delay: q(3 + i * 6 + seeded(i, 23) * 4),
        duration: q(1.6 + seeded(i, 24) * 0.9),
      })),
    [],
  );

  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(90rem 60rem at 50% -20%, rgba(139,92,246,0.5), transparent 62%), radial-gradient(60rem 45rem at 85% 75%, rgba(99,102,241,0.3), transparent 60%), linear-gradient(180deg, #140a3a 0%, #0c0d2e 45%, #05061a 100%)",
        }}
      />
      {/* Faint nebula banding for depth behind the stars. */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(40rem 22rem at 22% 32%, rgba(167,139,250,0.22), transparent 65%), radial-gradient(34rem 20rem at 72% 62%, rgba(56,189,248,0.16), transparent 65%)",
          animation: "aurora-drift 26s ease-in-out infinite alternate",
        }}
      />
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            boxShadow: s.bright ? "0 0 6px 1px rgba(196,181,253,0.9)" : undefined,
            animation: `star-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
      {shooting.map((s, i) => (
        <span
          key={`sh-${i}`}
          className="absolute h-px w-24 rounded-full"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            background: "linear-gradient(90deg, transparent, #fff, transparent)",
            // 14s cycle keeps streaks sparse — they should feel incidental.
            animation: `shooting-star ${s.duration}s ease-in ${s.delay}s infinite`,
            animationDuration: `${s.duration}s, 14s`,
            opacity: 0,
          }}
        />
      ))}
    </>
  );
}

/* ── Embers: heat rising from the bottom of the screen ────────────────────── */
function Embers() {
  const embers = useMemo(
    () =>
      Array.from({ length: 85 }, (_, i) => ({
        left: q(seeded(i, 1) * 100),
        size: q(2 + seeded(i, 2) * 5, 1),
        duration: q(6 + seeded(i, 3) * 9),
        delay: q(seeded(i, 4) * 12),
        drift: q(-60 + seeded(i, 5) * 120),
        hot: seeded(i, 6) > 0.55,
      })),
    [],
  );

  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(80rem 50rem at 50% 118%, rgba(255,80,50,0.55), transparent 64%), radial-gradient(60rem 40rem at 15% 8%, rgba(251,146,60,0.3), transparent 62%), radial-gradient(50rem 35rem at 88% 30%, rgba(220,38,38,0.28), transparent 60%), linear-gradient(180deg, #2a0a08 0%, #1a0714 48%, #07060f 100%)",
        }}
      />
      {/* Heat haze pooling along the bottom edge. */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            "linear-gradient(0deg, rgba(255,90,40,0.45), rgba(255,140,60,0.12) 45%, transparent)",
          animation: "heat-pulse 5s ease-in-out infinite",
        }}
      />
      {/* Slow flame-coloured wash so the whole screen breathes, not just the base. */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(45rem 30rem at 30% 70%, rgba(249,115,22,0.22), transparent 65%), radial-gradient(40rem 26rem at 75% 45%, rgba(239,68,68,0.2), transparent 65%)",
          animation: "aurora-drift 20s ease-in-out infinite alternate",
        }}
      />
      {embers.map((e, i) => (
        <span
          key={i}
          className="absolute bottom-0 rounded-full"
          style={{
            left: `${e.left}%`,
            width: e.size,
            height: e.size,
            background: e.hot ? "#ffb347" : "#ff6b4a",
            boxShadow: `0 0 ${e.size * 3}px ${e.size}px ${e.hot ? "rgba(255,179,71,0.7)" : "rgba(255,107,74,0.6)"}`,
            ["--drift" as string]: `${e.drift}px`,
            animation: `ember-rise ${e.duration}s linear ${e.delay}s infinite`,
            opacity: 0,
          }}
        />
      ))}
    </>
  );
}

/* ── Gold: hall-of-fame light shafts and drifting motes ───────────────────── */
function GoldHall() {
  const motes = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        left: q(seeded(i, 1) * 100),
        size: q(1.5 + seeded(i, 2) * 3.5, 1),
        duration: q(10 + seeded(i, 3) * 12),
        delay: q(seeded(i, 4) * 14),
        drift: q(-45 + seeded(i, 5) * 90),
      })),
    [],
  );

  const rays = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        left: q(2 + i * 13 + seeded(i, 11) * 5),
        width: q(4 + seeded(i, 12) * 8),
        duration: q(8 + seeded(i, 13) * 6),
        delay: q(seeded(i, 14) * 5),
      })),
    [],
  );

  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70rem 55rem at 50% -18%, rgba(251,191,36,0.55), transparent 64%), radial-gradient(55rem 42rem at 82% 88%, rgba(180,83,9,0.35), transparent 62%), radial-gradient(45rem 34rem at 12% 62%, rgba(234,179,8,0.22), transparent 62%), linear-gradient(180deg, #2a2008 0%, #14100a 48%, #06060f 100%)",
        }}
      />
      {/* Marble-hall floor glow at the base. */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background: "linear-gradient(0deg, rgba(251,191,36,0.22), transparent)",
          animation: "heat-pulse 7s ease-in-out infinite",
        }}
      />
      {/* Shafts of light from above, like a trophy hall. */}
      {rays.map((r, i) => (
        <span
          key={`ray-${i}`}
          className="absolute top-0 origin-top"
          style={{
            left: `${r.left}%`,
            width: `${r.width}rem`,
            height: "70vh",
            background:
              "linear-gradient(180deg, rgba(251,191,36,0.16), rgba(251,191,36,0.05) 45%, transparent)",
            filter: "blur(14px)",
            transform: "skewX(-8deg)",
            animation: `ray-breathe ${r.duration}s ease-in-out ${r.delay}s infinite`,
          }}
        />
      ))}
      {motes.map((m, i) => (
        <span
          key={i}
          className="absolute bottom-0 rounded-full bg-exp"
          style={{
            left: `${m.left}%`,
            width: m.size,
            height: m.size,
            boxShadow: "0 0 8px 2px rgba(251,191,36,0.7)",
            ["--drift" as string]: `${m.drift}px`,
            animation: `ember-rise ${m.duration}s linear ${m.delay}s infinite`,
            opacity: 0,
          }}
        />
      ))}
    </>
  );
}

/* ── Library: warm, cosy, slow dust in lamplight ──────────────────────────── */
function Library() {
  const dust = useMemo(
    () =>
      Array.from({ length: 65 }, (_, i) => ({
        left: q(seeded(i, 1) * 100),
        top: q(seeded(i, 2) * 100),
        size: q(1.5 + seeded(i, 3) * 3, 1),
        duration: q(16 + seeded(i, 4) * 16),
        delay: q(seeded(i, 5) * 14),
        drift: q(-35 + seeded(i, 6) * 70),
      })),
    [],
  );

  // Warm shelf bands running up the sides, like bookcases in low light.
  const shelves = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        top: q(4 + i * 7 + seeded(i, 9) * 2),
        side: i % 2 === 0,
        width: q(8 + seeded(i, 10) * 9),
        opacity: q(0.05 + seeded(i, 11) * 0.07, 3),
      })),
    [],
  );

  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(58rem 44rem at 18% 18%, rgba(217,119,6,0.4), transparent 62%), radial-gradient(52rem 40rem at 86% 78%, rgba(120,53,15,0.42), transparent 60%), radial-gradient(40rem 30rem at 55% 50%, rgba(52,211,153,0.14), transparent 62%), linear-gradient(180deg, #1c1206 0%, #120e0c 45%, #06070f 100%)",
        }}
      />
      {shelves.map((s, i) => (
        <span
          key={`shelf-${i}`}
          className="absolute h-6"
          style={{
            top: `${s.top}%`,
            [s.side ? "left" : "right"]: 0,
            width: `${s.width}rem`,
            background:
              "linear-gradient(90deg, rgba(217,119,6,0.5), rgba(120,53,15,0.15), transparent)",
            transform: s.side ? undefined : "scaleX(-1)",
            opacity: s.opacity,
            filter: "blur(3px)",
          }}
        />
      ))}
      {/* Lamplight vignette — warm centre, shadowed edges. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(253,186,116,0.1) 0%, transparent 42%, rgba(4,4,10,0.72) 100%)",
        }}
      />
      {dust.map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            background: "rgba(253,230,190,0.75)",
            boxShadow: "0 0 5px 1px rgba(253,230,190,0.4)",
            ["--drift" as string]: `${d.drift}px`,
            animation: `dust-float ${d.duration}s ease-in-out ${d.delay}s infinite`,
          }}
        />
      ))}
    </>
  );
}

export function Atmosphere({ theme }: { theme: AtmosphereTheme }) {
  return (
    /*
     * z-0, NOT a negative z-index.
     *
     * `body::before` paints an opaque gradient at z-index -2, so anything
     * further back is invisible — which is exactly what happened when this sat
     * at -z-10. Sitting at 0 puts the atmosphere above the body backdrop, and
     * page content (relative z-10 in the app layout) still paints over it.
     */
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {theme === "starfield" && <Starfield />}
      {theme === "embers" && <Embers />}
      {theme === "gold" && <GoldHall />}
      {theme === "library" && <Library />}

      {/*
        Glyphs only on the plain "glyphs" theme.
        The themed pages (Fresh, Trending, Ranks, Saved) deliberately keep their
        backgrounds pure — stars, embers, gold and lamplight respectively — and
        show the PlayStation motif only inside the hero card, where PageHero
        renders its own accent-tinted GlyphField.
      */}
      {theme === "glyphs" && (
        <GlyphField density="rich" edgeBias={false} className="opacity-70" />
      )}
    </div>
  );
}
