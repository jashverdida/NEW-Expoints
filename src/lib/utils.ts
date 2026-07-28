import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className joiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Compact relative time, the style the old app called "Facebook-style".
 * "now" · "5m" · "2h" · "3d" · "2w" · "Oct 20" · "Oct 20, 2024"
 */
export function timeAgo(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (Number.isNaN(seconds)) return "";
  if (seconds < 45) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 172800) return "yesterday";
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w`;

  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** Full timestamp for `title` attributes and profile metadata. */
export function formatDate(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** 1200 → "1.2K", 1_500_000 → "1.5M". Keeps counters from breaking layouts. */
export function compactNumber(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) {
    const n = value / 1000;
    return `${n % 1 === 0 ? n : n.toFixed(1)}K`;
  }
  const n = value / 1_000_000;
  return `${n % 1 === 0 ? n : n.toFixed(1)}M`;
}

/** Deterministic avatar fallback colour, so a user's initial tile is stable. */
export function avatarGradient(seed: string): string {
  const palettes = [
    "from-sky-500 to-indigo-600",
    "from-violet-500 to-purple-700",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-cyan-500 to-blue-600",
    "from-fuchsia-500 to-violet-600",
    "from-lime-500 to-emerald-600",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return palettes[Math.abs(hash) % palettes.length];
}

export function initials(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9 ]/g, " ").trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Trim to a word boundary for feed previews. */
export function excerpt(text: string, max = 280): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max).trimEnd()}…`;
}

/** Reading-time estimate shown on long reviews. */
export function readingTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 220))} min read`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 110);
}

/** Maps a 1–10 review score to a verdict label + colour. */
export function ratingVerdict(rating: number): { label: string; color: string } {
  if (rating >= 9) return { label: "Masterpiece", color: "#34d399" };
  if (rating >= 8) return { label: "Great", color: "#4ade80" };
  if (rating >= 7) return { label: "Good", color: "#a3e635" };
  if (rating >= 6) return { label: "Decent", color: "#facc15" };
  if (rating >= 5) return { label: "Mixed", color: "#fb923c" };
  if (rating >= 3) return { label: "Bad", color: "#f87171" };
  return { label: "Avoid", color: "#ef4444" };
}

/** Base URL for auth redirects — works locally, on previews and in production. */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
