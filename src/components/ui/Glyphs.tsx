"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type GlyphKind = "circle" | "cross" | "square" | "triangle" | "spark" | "diamond";

const GLYPH_PATHS: Record<GlyphKind, React.ReactNode> = {
  circle: <circle cx="12" cy="12" r="8" />,
  square: <rect x="4.5" y="4.5" width="15" height="15" rx="2.5" />,
  triangle: <path d="M12 4 20.5 19.5h-17z" />,
  cross: <path d="M5.5 5.5l13 13M18.5 5.5l-13 13" />,
  diamond: <path d="M12 3.5 20.5 12 12 20.5 3.5 12z" />,
  spark: <path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6L6 18" />,
};

/**
 * Motion behaviours. Mixing them is what stops the field reading as one
 * mechanical loop — the original had every glyph on an identical keyframe, so
 * they visibly moved in lockstep.
 *
 *  drift  — floats and rotates at steady opacity (the classic behaviour)
 *  pulse  — fades in while scaling up, out while scaling down
 *  sway   — slow horizontal drift with a lazy spin
 *  breathe— stays put, opacity swells and fades
 */
type Motion = "drift" | "pulse" | "sway" | "breathe";

const MOTION_ANIMATION: Record<Motion, string> = {
  drift: "glyph-drift",
  pulse: "glyph-pulse",
  sway: "glyph-sway",
  breathe: "glyph-breathe",
};

export type GlyphDensity = "ambient" | "light" | "normal" | "rich";

const DENSITY_COUNT: Record<GlyphDensity, number> = {
  ambient: 7, // behind app pages — present but never distracting
  light: 10,
  normal: 16,
  rich: 24, // landing hero
};

/**
 * Floating PlayStation-button glyphs.
 *
 * Positions come from a seeded pseudo-random function rather than Math.random,
 * so the server and client render identical markup — Math.random here would
 * produce a hydration mismatch on every load.
 *
 * Glyphs are pushed toward the edges of the container (see `edgeBias`) so they
 * frame the content instead of scattering across the text.
 */
export function GlyphField({
  density = "normal",
  count,
  className,
  edgeBias = true,
}: {
  density?: GlyphDensity;
  count?: number;
  className?: string;
  edgeBias?: boolean;
}) {
  const total = count ?? DENSITY_COUNT[density];

  const glyphs = useMemo(() => {
    const kinds: GlyphKind[] = ["circle", "cross", "square", "triangle", "diamond", "spark"];
    const motions: Motion[] = ["drift", "pulse", "sway", "breathe"];

    // Deterministic hash-based noise: same output every render.
    const rand = (n: number, salt: number) => {
      const x = Math.sin(n * 127.1 + salt * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };

    /*
     * Quantise every value that ends up in a style string.
     *
     * `rand` returns full-precision floats like 23.24983538933884. React
     * serialises that verbatim into the SSR HTML, but the browser normalises it
     * to 23.2498% when it parses the style attribute — so on hydration React
     * compares its own long float against the browser's rounded one, decides
     * the markup doesn't match, and throws a hydration error. Rounding here
     * means both sides produce byte-identical strings.
     */
    const q = (value: number, decimals = 2) => Number(value.toFixed(decimals));

    return Array.from({ length: total }, (_, i) => {
      let left = rand(i, 1) * 100;

      /*
       * Push horizontal positions away from the centre column so glyphs sit in
       * the margins rather than on top of headlines. Values land in roughly
       * 0-28% and 72-100% instead of spanning the full width.
       */
      if (edgeBias) {
        const side = rand(i, 7) > 0.5 ? 1 : 0;
        left = side === 0 ? rand(i, 1) * 28 : 72 + rand(i, 1) * 28;
      }

      const motion = motions[Math.floor(rand(i, 8) * motions.length)];

      return {
        kind: kinds[Math.floor(rand(i, 9) * kinds.length)],
        motion,
        left: q(left),
        top: q(3 + rand(i, 2) * 92),
        // Whole pixels — no fractional sizes to round-trip.
        size: Math.round(16 + rand(i, 3) * 32),
        duration: q(9 + rand(i, 4) * 11),
        delay: q(rand(i, 5) * 9),
        // Pulse/breathe animate their own opacity, so only the steady
        // behaviours get a fixed value here.
        opacity:
          motion === "pulse" || motion === "breathe" ? undefined : q(0.16 + rand(i, 6) * 0.26),
        strokeWidth: rand(i, 10) > 0.7 ? 1.25 : 1.75,
      };
    });
  }, [total, edgeBias]);

  return (
    <div
      aria-hidden="true"
      className={cn("fx-layer pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {glyphs.map((g, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={g.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          /*
           * `filter` and `will-change` live in the .glyph class rather than
           * inline. Browsers re-serialise drop-shadow() with the colour first
           * and explicit 0px units, which React reads as another hydration
           * mismatch. Keeping constants in CSS sidesteps that entirely and
           * leaves only per-glyph values inline.
           */
          className="glyph absolute text-brand-200"
          style={{
            left: `${g.left}%`,
            top: `${g.top}%`,
            width: g.size,
            height: g.size,
            opacity: g.opacity,
            animation: `${MOTION_ANIMATION[g.motion]} ${g.duration}s ease-in-out ${g.delay}s infinite`,
          }}
        >
          {GLYPH_PATHS[g.kind]}
        </svg>
      ))}
    </div>
  );
}

/**
 * Fixed, full-viewport glyph layer for the app shell. Sits behind all content
 * at very low density so every page carries the motif without competing with
 * the UI.
 */
/**
 * Routes that own their background outright.
 *
 * Fresh is a night sky, Trending is embers, Ranks is a gold hall and Saved is
 * lamplit shelves — dropping blue glyphs over any of those muddies the effect.
 * They still show the motif, but only inside their hero card (PageHero renders
 * an accent-tinted GlyphField of its own).
 */
const THEMED_ROUTES = ["/newest", "/popular", "/leaderboard", "/bookmarks"];

export function AmbientGlyphs() {
  const pathname = usePathname();

  const isThemed = THEMED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  if (isThemed) return null;

  return (
    // z-0 rather than a negative index — body::before paints an opaque gradient
    // at -2, which would otherwise bury this entirely.
    <div aria-hidden="true" className="fx-layer pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <GlyphField density="normal" edgeBias={false} className="opacity-60" />
    </div>
  );
}
