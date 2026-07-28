/**
 * The EXP economy.
 *
 * These formulas MIRROR the SQL functions `exp_to_level` / `level_floor` /
 * `exp_reward` in supabase/schema.sql. The database is authoritative — this
 * copy exists so the UI can draw progress bars without a round trip. If you
 * retune one, retune both.
 *
 *   Total EXP required to reach level n  =  25 · (n−1) · n
 *     L2 = 50    L3 = 150    L5 = 500    L10 = 2,250    L20 = 9,500    L50 = 61,250
 */

export const EXP_REWARDS = {
  post_created: 10,
  comment_created: 5,
  post_star_received: 15,
  comment_star_received: 8,
} as const;

export type ExpAction = keyof typeof EXP_REWARDS;

/** Total EXP needed to reach `level`. Inverse of {@link levelFromExp}. */
export function expFloorForLevel(level: number): number {
  const n = Math.max(1, Math.floor(level));
  return 25 * (n - 1) * n;
}

/** The level a given EXP total earns. O(1) — solves the quadratic directly. */
export function levelFromExp(exp: number): number {
  const e = Math.max(0, exp);
  return Math.max(1, Math.floor((25 + Math.sqrt(625 + 100 * e)) / 50));
}

export interface LevelProgress {
  level: number;
  exp: number;
  /** EXP total at which the current level began. */
  currentFloor: number;
  /** EXP total needed for the next level. */
  nextFloor: number;
  /** EXP earned inside the current level. */
  intoLevel: number;
  /** EXP span of the current level. */
  levelSpan: number;
  /** EXP still needed to level up. */
  remaining: number;
  /** 0–100, for progress bars. */
  percent: number;
}

export function levelProgress(exp: number): LevelProgress {
  const safeExp = Math.max(0, Math.floor(exp));
  const level = levelFromExp(safeExp);
  const currentFloor = expFloorForLevel(level);
  const nextFloor = expFloorForLevel(level + 1);
  const levelSpan = Math.max(1, nextFloor - currentFloor);
  const intoLevel = safeExp - currentFloor;

  return {
    level,
    exp: safeExp,
    currentFloor,
    nextFloor,
    intoLevel,
    levelSpan,
    remaining: Math.max(0, nextFloor - safeExp),
    percent: Math.min(100, Math.max(0, (intoLevel / levelSpan) * 100)),
  };
}

/**
 * Rank tiers. Each level band gets a name, a colour ramp and a glow, which the
 * UI uses for level badges, avatar rings and leaderboard rows. Higher tiers get
 * visibly louder treatments — that progression is the point of the whole app.
 */
export interface Rank {
  name: string;
  minLevel: number;
  /** Tailwind gradient stops. */
  gradient: string;
  /** Solid accent for text/borders. */
  accent: string;
  /** rgba used for glow shadows. */
  glow: string;
}

export const RANKS: Rank[] = [
  {
    name: "Rookie",
    minLevel: 1,
    gradient: "from-slate-400 to-slate-500",
    accent: "#94a3b8",
    glow: "rgba(148,163,184,0.45)",
  },
  {
    name: "Grinder",
    minLevel: 5,
    gradient: "from-emerald-400 to-teal-500",
    accent: "#34d399",
    glow: "rgba(52,211,153,0.5)",
  },
  {
    name: "Veteran",
    minLevel: 10,
    gradient: "from-sky-400 to-blue-500",
    accent: "#38bdf8",
    glow: "rgba(56,189,248,0.55)",
  },
  {
    name: "Elite",
    minLevel: 20,
    gradient: "from-violet-400 to-fuchsia-500",
    accent: "#a78bfa",
    glow: "rgba(167,139,250,0.6)",
  },
  {
    name: "Master",
    minLevel: 35,
    gradient: "from-amber-300 to-orange-500",
    accent: "#fbbf24",
    glow: "rgba(251,191,36,0.65)",
  },
  {
    name: "Legend",
    minLevel: 50,
    gradient: "from-rose-400 via-fuchsia-500 to-amber-400",
    accent: "#fb7185",
    glow: "rgba(251,113,133,0.7)",
  },
];

export function rankForLevel(level: number): Rank {
  let match = RANKS[0];
  for (const rank of RANKS) {
    if (level >= rank.minLevel) match = rank;
  }
  return match;
}

/** Perks unlocked by level — surfaced on the profile so progress feels earned. */
export interface Perk {
  level: number;
  label: string;
  description: string;
}

export const PERKS: Perk[] = [
  { level: 1, label: "Post & Comment", description: "Write reviews and join any thread." },
  { level: 3, label: "Custom Bio", description: "Tell the forum who you are." },
  { level: 5, label: "Feed Boost I", description: "Your reviews rank higher on the dashboard." },
  { level: 10, label: "Showcase", description: "Pin your three best reviews to your profile." },
  { level: 15, label: "Feed Boost II", description: "A stronger push toward the front page." },
  { level: 20, label: "Elite Frame", description: "An animated ring around your avatar." },
  { level: 35, label: "Master Badge", description: "A gold badge next to your name everywhere." },
  { level: 50, label: "Legend Status", description: "Permanent leaderboard placement and aura." },
];

export function unlockedPerks(level: number): Perk[] {
  return PERKS.filter((p) => level >= p.level);
}

export function nextPerk(level: number): Perk | null {
  return PERKS.find((p) => p.level > level) ?? null;
}
