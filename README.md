<div align="center">

# ✦ EXPoints

### Game reviews worth levelling up for.

A gamified game-review forum where every post, comment and star you earn feeds a
real progression system — climb it and your takes hit the front page.

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## What is this?

Most gaming forums are grey walls of text. EXPoints is built the other way
round: a deep-space blue interface with drifting PlayStation glyphs, themed
atmospheres per section, and a progression system you can actually see moving.

Write a review, earn EXP. Collect stars, earn more. Level up and the ranking
algorithm genuinely pushes your posts toward the front page.

<div align="center">

| | |
|:--|:--|
| ⚡ **EXP for everything** | Post, comment, get starred — every contribution moves a visible bar |
| 📈 **Level up, get seen** | Your level feeds directly into the hot-ranking algorithm |
| ⭐ **Reviews with a score** | Every review carries a 1–10 verdict, so games build real aggregate ratings |
| 🛡️ **Actually moderated** | Admins hide posts and ban accounts; reports go to a real queue |
| 🔍 **Search that works** | Filter by title, body or author with trigram fuzzy matching |
| 🔖 **Save for later** | Bookmark any review; your list follows you across devices |

</div>

---

## The EXP economy

Defined once in SQL (`exp_reward()`) and mirrored in `src/lib/exp.ts` so the UI
can draw progress bars without a round trip.

| Action | EXP |
|:--|--:|
| Publish a review | **+10** |
| Leave a comment | **+5** |
| Your review gets starred | **+15** |
| Your comment gets starred | **+8** |

Un-starring reverses the award, and self-stars earn nothing — otherwise the
leaderboard would be trivially farmable.

### Levels

Total EXP to reach level *n* is `25 · (n−1) · n`:

| Level | 2 | 3 | 5 | 10 | 20 | 50 |
|:--|--:|--:|--:|--:|--:|--:|
| **Total EXP** | 50 | 150 | 500 | 2,250 | 9,500 | 61,250 |

### Ranks

`Rookie` → `Grinder` (5) → `Veteran` (10) → `Elite` (20) → `Master` (35) → `Legend` (50)

Your tier colours your level badge, your avatar ring and your leaderboard row.

---

## Themed atmospheres

Each section owns its whole screen, not just a header card:

| Page | Atmosphere |
|:--|:--|
| **Feed** | PlayStation glyphs drifting across the viewport |
| **Fresh Content** | Night sky — 190 stars, occasional shooting star |
| **Trending Now** | Embers rising from the bottom, pulsing heat haze |
| **Hall of Fame** | Gold light shafts, drifting motes, trophy-hall glow |
| **Your Vault** | Warm lamplight, slow dust, cosy library shelves |

All transform/opacity only, so they run on the GPU compositor and never trigger
layout.

---

## Tech stack

| Layer | Choice | Why |
|:--|:--|:--|
| Framework | **Next.js 15** (App Router) | Server Components kill N+1 queries; Vercel is its home turf |
| UI | **React 19** + **Tailwind v4** | `useOptimistic` makes starring feel instant |
| Database | **Supabase** (Postgres) | RLS, Auth, Storage and Realtime in one place |
| Hosting | **Vercel** | Zero-config deploys, edge middleware |

---

## Getting started

### 1. Create a Supabase project

At [supabase.com](https://supabase.com). Keep **Enable Data API** and
**Automatically expose new tables** switched on — the schema relies on the
default grants and secures rows with RLS instead.

### 2. Run the SQL

Dashboard → **SQL Editor** → **New query**, then run in order:

```
supabase/schema.sql    ← tables, triggers, RLS, the post_feed view, storage
supabase/seed.sql      ← 30 games to start the catalogue
```

Already have a database from before? Also run everything in
`supabase/migrations/` in filename order.

### 3. Configure

```bash
cp .env.example .env.local
```

| Variable | Where | Notes |
|:--|:--|:--|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API Keys → publishable | Public, RLS-protected |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API Keys → secret | **Server only.** Never prefix `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | — | `http://localhost:3000` locally |

### 4. Run

```bash
npm install
npm run dev
```

> [!TIP]
> `npm run dev` recompiles each route on first visit, which makes navigation
> feel slow. That is **not** representative of production. To judge real
> performance use `npm run build && npm run start`.

### 5. Make yourself an admin

Sign up through the UI first, then:

```sql
update profiles set role = 'admin' where username = 'YourUsername';
```

---

## Deploying to Vercel

1. Import the repo at [vercel.com/new](https://vercel.com/new).
2. Add the four environment variables. Set `NEXT_PUBLIC_SITE_URL` to your
   production domain.
3. Deploy.

> [!IMPORTANT]
> In Supabase → **Authentication → URL Configuration**, set the Site URL to your
> Vercel domain and add `https://your-domain/auth/callback` to **Redirect URLs**.
> Email confirmation and password resets fail silently until you do.

Everything is serverless-compatible: no filesystem writes, no long-lived
connections, no session files on disk.

---

## Architecture notes

<details>
<summary><strong>Why the feed is fast</strong></summary>

Counters (`star_count`, `comment_count`, `stars_received`) are **denormalised
columns maintained by database triggers**, not `COUNT(*)` subqueries. The whole
feed is one indexed scan over the `post_feed` view, plus two `IN` lookups for
the viewer's stars and bookmarks — three queries total, regardless of how many
posts are on the page.

Ranking uses a stored `hot_score` (Reddit's algorithm plus a level bonus), so
"what's hot" is an index scan rather than a full-table sort.

</details>

<details>
<summary><strong>Why interactions feel instant</strong></summary>

Starring uses React's `useOptimistic`: the icon and count flip on the next
frame, then reconcile with the server in the background and roll back on
failure.

Sort tabs and pagination are in-place data swaps against `/api/feed`, cached per
`(sort, page)` and prefetched on idle — so the common case is 0 ms. The URL is
updated with `history.pushState`, keeping links shareable and the back button
working without asking the server to re-render.

</details>

<details>
<summary><strong>Why EXP can't be gamed</strong></summary>

EXP is awarded **only** by `award_exp()`, called from triggers. Application code
never touches the column, so it can't drift or be double-awarded by a duplicate
submission.

A `guard_profile_columns()` trigger blocks users from writing `exp`, `level`,
`role` or ban state directly. System triggers flag their own writes with a
transaction-local setting so they pass, while a REST call from a user never can.

</details>

<details>
<summary><strong>Project layout</strong></summary>

```
src/
  app/
    (auth)/          login, register, forgot-password
    (app)/           authenticated shell — feed, post, profile, games, admin
    discover/        public read-only feed (indexed by search engines)
    api/feed/        JSON endpoint powering instant sort/pagination
  components/
    ui/              Avatar, LevelBadge, ExpBar, Glyphs, Atmosphere, Toast
    post/            PostCard, StarButton, BookmarkButton, RatingBadge
    feed/            FeedClient, SortTabs, SideRail, PageHero
  lib/
    supabase/        browser / server / admin / middleware clients
    queries.ts       all reads (server-only)
    actions.ts       all writes (server actions)
    exp.ts           EXP + rank math, mirrors the SQL
supabase/
  schema.sql         run first
  seed.sql           then this
  migrations/        then these, in order
```

**Where to make changes:** reads go in `queries.ts`, writes in `actions.ts`.
Nothing else touches the database directly.

</details>

---

## Roles

- **User** — post, comment, star, bookmark, report, edit their own profile and reviews.
- **Admin** — all of the above, plus hide/restore any post, delete any content,
  ban and unban accounts, promote and demote admins, and work the report queue.
  Every admin action is written to `moderation_log`.

Banned users are redirected to `/banned`, which shows the reason and how to
appeal. Their posts disappear forum-wide.

---

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

---

<div align="center">

### Built by

**Eijay P. Pepito** · **Jashmine Verdida** · **Lord Christian Beligaño**

<sub>Three people who were tired of bland forums.</sub>

</div>
