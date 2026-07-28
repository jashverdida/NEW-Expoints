-- ═══════════════════════════════════════════════════════════════════════════
--  EXPoints v2 — Complete Supabase schema
--
--  Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New
--  query → paste → Run). It is idempotent enough to re-run during development.
--
--  DESIGN NOTES — why this differs from the PHP schema
--  ───────────────────────────────────────────────────
--  1. Identity lives in Supabase's own `auth.users`. We no longer keep a
--     `users` table with a `password` column. `profiles` hangs off auth.users
--     via a FK, so there is exactly one row per human.
--  2. Counters (`star_count`, `comment_count`, `reply_count`) are DENORMALISED
--     and maintained by triggers. The old dashboard ran one COUNT(*) per post
--     per metric — 50 posts meant 100+ round trips. The feed is now a single
--     SELECT.
--  3. EXP is awarded by triggers, not by application code. It cannot drift out
--     of sync and cannot be double-awarded by a duplicate form submission.
--  4. `level` and `hot_score` are computed in the database so ranking is
--     indexable rather than sorted in PHP after the fact.
--  5. RLS policies are real. The old ones were all `USING (true)`, which meant
--     anyone with the anon key could rewrite any row.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";      -- fuzzy search on titles/games

-- ───────────────────────────────────────────────────────────────────────────
--  ENUMS
-- ───────────────────────────────────────────────────────────────────────────
do $$ begin
  create type user_role as enum ('user', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum (
    'star', 'comment', 'reply', 'level_up', 'mention', 'system', 'moderation'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('pending', 'resolved', 'dismissed');
exception when duplicate_object then null; end $$;


-- ═══════════════════════════════════════════════════════════════════════════
--  EXP + LEVEL MATH  (single source of truth — mirrored in src/lib/exp.ts)
-- ═══════════════════════════════════════════════════════════════════════════

-- Total EXP required to *reach* level n is  25 * (n-1) * n.
--   L2 = 50    L3 = 150    L5 = 500    L10 = 2,250    L20 = 9,500
-- Inverting that quadratic gives the level for any EXP total in O(1).
create or replace function exp_to_level(total_exp integer)
returns integer
language sql
immutable
parallel safe
as $$
  select greatest(1, floor((25 + sqrt(625 + 100 * greatest(total_exp, 0)::numeric)) / 50)::integer);
$$;

-- EXP floor of a given level — used to draw the progress bar.
create or replace function level_floor(lvl integer)
returns integer
language sql
immutable
parallel safe
as $$
  select (25 * greatest(lvl - 1, 0) * greatest(lvl, 1))::integer;
$$;

-- How much EXP each action is worth. Kept in one place so the economy can be
-- retuned without hunting through triggers.
create or replace function exp_reward(action text)
returns integer
language sql
immutable
parallel safe
as $$
  select case action
    when 'post_created'           then 10
    when 'comment_created'        then 5
    when 'post_star_received'     then 15
    when 'comment_star_received'  then 8
    else 0
  end;
$$;


-- ═══════════════════════════════════════════════════════════════════════════
--  TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- ── profiles ───────────────────────────────────────────────────────────────
create table if not exists profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        varchar(24)  not null unique,
  display_name    varchar(60),
  bio             text         default '',
  avatar_url      text,
  banner_url      text,

  favorite_game   text,
  favorite_genre  text,

  exp             integer      not null default 0,
  -- Stored (not generated) so it can be indexed and so the level-up trigger
  -- has a previous value to compare against.
  level           integer      not null default 1,

  role            user_role    not null default 'user',

  is_banned       boolean      not null default false,
  ban_reason      text,
  banned_at       timestamptz,
  banned_by       uuid references profiles(id) on delete set null,

  post_count      integer      not null default 0,
  comment_count   integer      not null default 0,
  stars_received  integer      not null default 0,

  pinned_post_ids bigint[]     not null default '{}',   -- "Best Posts" showcase

  created_at      timestamptz  not null default now(),
  updated_at      timestamptz  not null default now(),

  constraint username_format check (username ~ '^[A-Za-z0-9_]{3,24}$')
);

create index if not exists idx_profiles_username  on profiles (lower(username));
create index if not exists idx_profiles_exp       on profiles (exp desc);
create index if not exists idx_profiles_role      on profiles (role);
create index if not exists idx_profiles_banned    on profiles (is_banned) where is_banned;
create index if not exists idx_profiles_trgm      on profiles using gin (username gin_trgm_ops);


-- ── games ──────────────────────────────────────────────────────────────────
-- The PHP version hardcoded eight games in a <select>, then bolted on a
-- "custom game" text field. This makes games first-class so they can have
-- their own hub pages and aggregate ratings.
create table if not exists games (
  id            bigserial primary key,
  slug          varchar(120) not null unique,
  name          varchar(160) not null,
  cover_url     text,
  release_year  smallint,
  genre         varchar(60),
  platforms     text[] not null default '{}',

  post_count    integer not null default 0,
  avg_rating    numeric(3,1),

  created_at    timestamptz not null default now()
);

create index if not exists idx_games_postcount on games (post_count desc);
create index if not exists idx_games_trgm      on games using gin (name gin_trgm_ops);


-- ── posts ──────────────────────────────────────────────────────────────────
create table if not exists posts (
  id             bigserial primary key,
  author_id      uuid not null references profiles(id) on delete cascade,
  game_id        bigint references games(id) on delete set null,

  title          varchar(160) not null,
  content        text not null,
  rating         smallint check (rating between 1 and 10),  -- the review score

  star_count     integer not null default 0,
  comment_count  integer not null default 0,
  view_count     integer not null default 0,

  -- Reddit-style hot ranking, maintained by trigger. Monotonic and indexable,
  -- so "what's hot" is an index scan instead of a full-table sort.
  hot_score      double precision not null default 0,

  is_hidden      boolean not null default false,
  hidden_reason  text,
  hidden_at      timestamptz,
  hidden_by      uuid references profiles(id) on delete set null,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint title_not_blank   check (length(btrim(title)) >= 3),
  constraint content_not_blank check (length(btrim(content)) >= 10)
);

create index if not exists idx_posts_hot     on posts (hot_score desc)  where not is_hidden;
create index if not exists idx_posts_new     on posts (created_at desc) where not is_hidden;
create index if not exists idx_posts_top     on posts (star_count desc) where not is_hidden;
create index if not exists idx_posts_author  on posts (author_id, created_at desc);
create index if not exists idx_posts_game    on posts (game_id, created_at desc);
create index if not exists idx_posts_trgm    on posts using gin (title gin_trgm_ops);


-- ── comments ───────────────────────────────────────────────────────────────
create table if not exists comments (
  id            bigserial primary key,
  post_id       bigint not null references posts(id) on delete cascade,
  author_id     uuid   not null references profiles(id) on delete cascade,
  parent_id     bigint references comments(id) on delete cascade,

  body          text not null,

  star_count    integer not null default 0,
  reply_count   integer not null default 0,

  is_hidden     boolean not null default false,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint body_not_blank check (length(btrim(body)) >= 1)
);

create index if not exists idx_comments_post   on comments (post_id, created_at);
create index if not exists idx_comments_parent on comments (parent_id, created_at);
create index if not exists idx_comments_author on comments (author_id, created_at desc);


-- ── stars (likes) ──────────────────────────────────────────────────────────
create table if not exists post_stars (
  post_id    bigint not null references posts(id) on delete cascade,
  user_id    uuid   not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists idx_post_stars_user on post_stars (user_id, created_at desc);

create table if not exists comment_stars (
  comment_id bigint not null references comments(id) on delete cascade,
  user_id    uuid   not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);


-- ── bookmarks ──────────────────────────────────────────────────────────────
create table if not exists bookmarks (
  post_id    bigint not null references posts(id) on delete cascade,
  user_id    uuid   not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists idx_bookmarks_user on bookmarks (user_id, created_at desc);


-- ── notifications ──────────────────────────────────────────────────────────
create table if not exists notifications (
  id         bigserial primary key,
  user_id    uuid not null references profiles(id) on delete cascade,
  actor_id   uuid references profiles(id) on delete cascade,
  type       notification_type not null,
  title      varchar(160) not null,
  body       text,
  link       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_inbox
  on notifications (user_id, is_read, created_at desc);


-- ── moderation ─────────────────────────────────────────────────────────────
create table if not exists reports (
  id           bigserial primary key,
  reporter_id  uuid   not null references profiles(id) on delete cascade,
  post_id      bigint references posts(id) on delete cascade,
  comment_id   bigint references comments(id) on delete cascade,
  target_user  uuid   references profiles(id) on delete cascade,

  reason       text not null,
  status       report_status not null default 'pending',
  resolved_by  uuid references profiles(id) on delete set null,
  resolved_at  timestamptz,
  resolution   text,

  created_at   timestamptz not null default now(),

  constraint report_has_target check (
    post_id is not null or comment_id is not null or target_user is not null
  )
);

create index if not exists idx_reports_status on reports (status, created_at desc);

create table if not exists moderation_log (
  id           bigserial primary key,
  moderator_id uuid not null references profiles(id) on delete cascade,
  action       varchar(40) not null,     -- hide_post | unhide_post | ban | unban | ...
  target_user  uuid references profiles(id) on delete set null,
  post_id      bigint references posts(id) on delete set null,
  reason       text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_modlog_created on moderation_log (created_at desc);


-- ═══════════════════════════════════════════════════════════════════════════
--  TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- ── updated_at ─────────────────────────────────────────────────────────────
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_profiles_touch on profiles;
create trigger trg_profiles_touch before update on profiles
  for each row execute function touch_updated_at();

drop trigger if exists trg_posts_touch on posts;
create trigger trg_posts_touch before update on posts
  for each row execute function touch_updated_at();

drop trigger if exists trg_comments_touch on comments;
create trigger trg_comments_touch before update on comments
  for each row execute function touch_updated_at();


-- ── new auth user → profile row ────────────────────────────────────────────
-- Runs inside Supabase's signup transaction, so a user can never exist
-- without a profile. Username comes from signup metadata; if it collides we
-- suffix it rather than failing the whole signup.
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  desired  text;
  final    text;
  attempt  integer := 0;
begin
  desired := coalesce(
    nullif(regexp_replace(new.raw_user_meta_data->>'username', '[^A-Za-z0-9_]', '', 'g'), ''),
    'Player' || substr(replace(new.id::text, '-', ''), 1, 8)
  );
  desired := left(desired, 20);
  if length(desired) < 3 then
    desired := 'Player' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  final := desired;
  while exists (select 1 from profiles p where lower(p.username) = lower(final)) loop
    attempt := attempt + 1;
    final := left(desired, 20) || attempt::text;
    exit when attempt > 999;
  end loop;

  insert into profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    final,
    nullif(new.raw_user_meta_data->>'display_name', ''),
    nullif(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do nothing;

  return new;
end $$;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();


-- ── EXP award + level-up notification ──────────────────────────────────────
-- The ONLY way EXP changes. Every caller goes through here.
create or replace function award_exp(target uuid, action text, multiplier integer default 1)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  delta      integer := exp_reward(action) * multiplier;
  old_level  integer;
  new_level  integer;
  new_exp    integer;
begin
  if target is null or delta = 0 then
    return;
  end if;

  select level into old_level from profiles where id = target;
  if not found then return; end if;

  -- Transaction-local flag telling guard_profile_columns() this is a system
  -- write. Without it the guard reverts the award, because triggers run inside
  -- the user's transaction with the user's JWT still set.
  perform set_config('app.system_write', 'on', true);

  update profiles
     set exp   = greatest(0, exp + delta),
         level = exp_to_level(greatest(0, exp + delta))
   where id = target
   returning exp, level into new_exp, new_level;

  perform set_config('app.system_write', 'off', true);

  -- Only celebrate on the way up.
  if new_level > old_level then
    insert into notifications (user_id, type, title, body, link)
    values (
      target,
      'level_up',
      'LEVEL UP — you hit Level ' || new_level || '!',
      'You are now Level ' || new_level || ' with ' || new_exp || ' EXP. Keep posting.',
      '/me'
    );
  end if;
end $$;


-- ── hot score ──────────────────────────────────────────────────────────────
-- Reddit's algorithm, plus a small additive bump for the author's level so
-- levelling up genuinely surfaces your posts on the dashboard (a core promise
-- of the product). Monotonic in time, so the index stays useful forever.
create or replace function compute_hot_score(
  stars integer, comments integer, author_level integer, created timestamptz
) returns double precision
language sql immutable parallel safe as $$
  select
    log(greatest(abs(stars * 3 + comments * 2), 1)::numeric + 1)::double precision * 1800
    + least(author_level, 60) * 90
    + extract(epoch from created)::double precision / 90;
$$;

create or replace function refresh_post_hot(p_post_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  update posts p
     set hot_score = compute_hot_score(
           p.star_count, p.comment_count,
           (select level from profiles where id = p.author_id),
           p.created_at
         )
   where p.id = p_post_id;
end $$;


-- ── post created / deleted ─────────────────────────────────────────────────
create or replace function on_post_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Marks the profile writes below as system-driven; see
  -- guard_profile_columns(), which would otherwise revert them.
  perform set_config('app.system_write', 'on', true);

  if tg_op = 'INSERT' then
    update profiles set post_count = post_count + 1 where id = new.author_id;
    if new.game_id is not null then
      update games set post_count = post_count + 1 where id = new.game_id;
    end if;
    perform award_exp(new.author_id, 'post_created');
    perform refresh_post_hot(new.id);

  elsif tg_op = 'DELETE' then
    update profiles set post_count = greatest(0, post_count - 1) where id = old.author_id;
    if old.game_id is not null then
      update games set post_count = greatest(0, post_count - 1) where id = old.game_id;
    end if;
  end if;

  perform set_config('app.system_write', 'off', true);
  return coalesce(new, old);
end $$;

drop trigger if exists trg_post_insert on posts;
create trigger trg_post_insert after insert on posts
  for each row execute function on_post_change();

drop trigger if exists trg_post_delete on posts;
create trigger trg_post_delete after delete on posts
  for each row execute function on_post_change();


-- ── post starred / unstarred ───────────────────────────────────────────────
create or replace function on_post_star_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  author       uuid;
  actor_name   text;
  post_title   text;
begin
  perform set_config('app.system_write', 'on', true);

  if tg_op = 'INSERT' then
    update posts set star_count = star_count + 1
      where id = new.post_id
      returning author_id, title into author, post_title;

    perform refresh_post_hot(new.post_id);

    -- Starring your own post counts toward the post's visible star_count but
    -- earns no EXP, no `stars_received` credit and no notification — otherwise
    -- the leaderboard is trivially farmable.
    if author is distinct from new.user_id then
      update profiles set stars_received = stars_received + 1 where id = author;
      perform award_exp(author, 'post_star_received');

      select username into actor_name from profiles where id = new.user_id;
      insert into notifications (user_id, actor_id, type, title, body, link)
      values (
        author, new.user_id, 'star',
        '@' || coalesce(actor_name, 'Someone') || ' starred your review',
        post_title,
        '/post/' || new.post_id
      );
    end if;

  elsif tg_op = 'DELETE' then
    update posts set star_count = greatest(0, star_count - 1)
      where id = old.post_id
      returning author_id into author;

    perform refresh_post_hot(old.post_id);

    -- Mirrors the INSERT branch exactly, so counters stay balanced.
    if author is distinct from old.user_id then
      update profiles set stars_received = greatest(0, stars_received - 1) where id = author;
      perform award_exp(author, 'post_star_received', -1);
    end if;
  end if;

  perform set_config('app.system_write', 'off', true);
  return coalesce(new, old);
end $$;

drop trigger if exists trg_post_star_insert on post_stars;
create trigger trg_post_star_insert after insert on post_stars
  for each row execute function on_post_star_change();

drop trigger if exists trg_post_star_delete on post_stars;
create trigger trg_post_star_delete after delete on post_stars
  for each row execute function on_post_star_change();


-- ── comment created / deleted ──────────────────────────────────────────────
create or replace function on_comment_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  post_author  uuid;
  post_title   text;
  parent_author uuid;
  actor_name   text;
begin
  perform set_config('app.system_write', 'on', true);

  if tg_op = 'INSERT' then
    update posts set comment_count = comment_count + 1
      where id = new.post_id
      returning author_id, title into post_author, post_title;

    update profiles set comment_count = comment_count + 1 where id = new.author_id;
    perform award_exp(new.author_id, 'comment_created');
    perform refresh_post_hot(new.post_id);

    select username into actor_name from profiles where id = new.author_id;

    if new.parent_id is not null then
      update comments set reply_count = reply_count + 1
        where id = new.parent_id
        returning author_id into parent_author;

      if parent_author is distinct from new.author_id then
        insert into notifications (user_id, actor_id, type, title, body, link)
        values (
          parent_author, new.author_id, 'reply',
          '@' || coalesce(actor_name, 'Someone') || ' replied to you',
          left(new.body, 140),
          '/post/' || new.post_id
        );
      end if;

    elsif post_author is distinct from new.author_id then
      insert into notifications (user_id, actor_id, type, title, body, link)
      values (
        post_author, new.author_id, 'comment',
        '@' || coalesce(actor_name, 'Someone') || ' commented on your review',
        left(new.body, 140),
        '/post/' || new.post_id
      );
    end if;

  elsif tg_op = 'DELETE' then
    update posts set comment_count = greatest(0, comment_count - 1) where id = old.post_id;
    update profiles set comment_count = greatest(0, comment_count - 1) where id = old.author_id;
    if old.parent_id is not null then
      update comments set reply_count = greatest(0, reply_count - 1) where id = old.parent_id;
    end if;
    perform refresh_post_hot(old.post_id);
  end if;

  perform set_config('app.system_write', 'off', true);
  return coalesce(new, old);
end $$;

drop trigger if exists trg_comment_insert on comments;
create trigger trg_comment_insert after insert on comments
  for each row execute function on_comment_change();

drop trigger if exists trg_comment_delete on comments;
create trigger trg_comment_delete after delete on comments
  for each row execute function on_comment_change();


-- ── comment starred / unstarred ────────────────────────────────────────────
create or replace function on_comment_star_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  author uuid;
begin
  perform set_config('app.system_write', 'on', true);

  if tg_op = 'INSERT' then
    update comments set star_count = star_count + 1
      where id = new.comment_id returning author_id into author;
    if author is distinct from new.user_id then
      update profiles set stars_received = stars_received + 1 where id = author;
      perform award_exp(author, 'comment_star_received');
    end if;

  elsif tg_op = 'DELETE' then
    update comments set star_count = greatest(0, star_count - 1)
      where id = old.comment_id returning author_id into author;
    if author is distinct from old.user_id then
      update profiles set stars_received = greatest(0, stars_received - 1) where id = author;
      perform award_exp(author, 'comment_star_received', -1);
    end if;
  end if;

  perform set_config('app.system_write', 'off', true);
  return coalesce(new, old);
end $$;

drop trigger if exists trg_comment_star_insert on comment_stars;
create trigger trg_comment_star_insert after insert on comment_stars
  for each row execute function on_comment_star_change();

drop trigger if exists trg_comment_star_delete on comment_stars;
create trigger trg_comment_star_delete after delete on comment_stars
  for each row execute function on_comment_star_change();


-- ── game average rating ────────────────────────────────────────────────────
create or replace function refresh_game_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  gid bigint := coalesce(new.game_id, old.game_id);
begin
  if gid is not null then
    update games g
       set avg_rating = (
         select round(avg(rating)::numeric, 1)
         from posts
         where game_id = gid and rating is not null and not is_hidden
       )
     where g.id = gid;
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists trg_game_rating on posts;
create trigger trg_game_rating
  after insert or update of rating, game_id, is_hidden or delete on posts
  for each row execute function refresh_game_rating();


-- ═══════════════════════════════════════════════════════════════════════════
--  HELPER FUNCTIONS FOR THE APP
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function is_admin(uid uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from profiles where id = uid and role = 'admin');
$$;

create or replace function is_active(uid uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from profiles where id = uid and not is_banned);
$$;

-- Atomic view counter — avoids a read-modify-write race from the app.
create or replace function bump_view_count(p_post_id bigint)
returns void language sql security definer set search_path = public as $$
  update posts set view_count = view_count + 1 where id = p_post_id;
$$;

-- Find-or-create a game by name. Lets users type any game (the old app could
-- only offer eight) while still keeping one canonical row per title.
create or replace function upsert_game(p_name text)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  p_slug text;
  gid    bigint;
begin
  p_name := btrim(p_name);
  if p_name = '' then return null; end if;

  p_slug := left(regexp_replace(lower(p_name), '[^a-z0-9]+', '-', 'g'), 110);
  p_slug := btrim(p_slug, '-');
  if p_slug = '' then p_slug := 'game-' || md5(p_name); end if;

  select id into gid from games where slug = p_slug;
  if gid is not null then return gid; end if;

  insert into games (slug, name) values (p_slug, left(p_name, 160))
  on conflict (slug) do update set name = excluded.name
  returning id into gid;

  return gid;
end $$;

-- Recalculate every hot score. Run occasionally (or after a bulk import) so
-- ranking reflects current author levels.
create or replace function reindex_hot_scores()
returns void language sql security definer set search_path = public as $$
  update posts p
     set hot_score = compute_hot_score(
           p.star_count, p.comment_count,
           coalesce((select level from profiles where id = p.author_id), 1),
           p.created_at
         );
$$;


-- ═══════════════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
--  Real policies this time. The anon key can read public content and write
--  only rows the signed-in user owns.
-- ═══════════════════════════════════════════════════════════════════════════

alter table profiles       enable row level security;
alter table games          enable row level security;
alter table posts          enable row level security;
alter table comments       enable row level security;
alter table post_stars     enable row level security;
alter table comment_stars  enable row level security;
alter table bookmarks      enable row level security;
alter table notifications  enable row level security;
alter table reports        enable row level security;
alter table moderation_log enable row level security;

-- ── profiles ──
drop policy if exists profiles_read   on profiles;
drop policy if exists profiles_update on profiles;
drop policy if exists profiles_admin  on profiles;

create policy profiles_read on profiles
  for select using (true);

-- A user may edit their own profile, but not their own role/EXP/ban status —
-- those columns are locked down by the guard trigger below.
create policy profiles_update on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy profiles_admin on profiles
  for all using (is_admin()) with check (is_admin());

-- Stop a user from self-promoting to admin or self-granting EXP.
create or replace function guard_profile_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  /*
   * System writes (award_exp and the counter triggers) set this
   * transaction-local flag around their updates. Without this check the guard
   * reverts them: those triggers run inside the *user's* transaction with the
   * user's JWT still set, so auth.uid() is their id, not null.
   *
   * A REST update from a user never sets the flag, so self-granting EXP or
   * self-promoting to admin is still impossible.
   */
  if coalesce(current_setting('app.system_write', true), 'off') = 'on' then
    return new;
  end if;

  -- auth.uid() is NULL for service-role connections, which is how the app's
  -- admin actions (ban / unban / role change) write these columns. Those
  -- callers have already been checked in requireAdmin(). An anonymous request
  -- also has a NULL uid, but it can never reach this trigger: the
  -- profiles_update policy requires auth.uid() = id, which NULL never
  -- satisfies.
  if auth.uid() is null or is_admin(auth.uid()) then
    return new;
  end if;
  new.role           := old.role;
  new.exp            := old.exp;
  new.level          := old.level;
  new.is_banned      := old.is_banned;
  new.ban_reason     := old.ban_reason;
  new.banned_at      := old.banned_at;
  new.banned_by      := old.banned_by;
  new.post_count     := old.post_count;
  new.comment_count  := old.comment_count;
  new.stars_received := old.stars_received;
  return new;
end $$;

drop trigger if exists trg_guard_profile on profiles;
create trigger trg_guard_profile before update on profiles
  for each row execute function guard_profile_columns();

-- ── games ──
drop policy if exists games_read on games;
drop policy if exists games_write on games;
create policy games_read  on games for select using (true);
create policy games_write on games for insert with check (is_active());

-- ── posts ──
drop policy if exists posts_read   on posts;
drop policy if exists posts_insert on posts;
drop policy if exists posts_update on posts;
drop policy if exists posts_delete on posts;
drop policy if exists posts_admin  on posts;

create policy posts_read on posts
  for select using (not is_hidden or author_id = auth.uid() or is_admin());

create policy posts_insert on posts
  for insert with check (auth.uid() = author_id and is_active());

create policy posts_update on posts
  for update using (auth.uid() = author_id and is_active())
  with check (auth.uid() = author_id);

create policy posts_delete on posts
  for delete using (auth.uid() = author_id);

create policy posts_admin on posts
  for all using (is_admin()) with check (is_admin());

-- ── comments ──
drop policy if exists comments_read   on comments;
drop policy if exists comments_insert on comments;
drop policy if exists comments_update on comments;
drop policy if exists comments_delete on comments;
drop policy if exists comments_admin  on comments;

create policy comments_read on comments
  for select using (not is_hidden or author_id = auth.uid() or is_admin());

create policy comments_insert on comments
  for insert with check (auth.uid() = author_id and is_active());

create policy comments_update on comments
  for update using (auth.uid() = author_id and is_active())
  with check (auth.uid() = author_id);

create policy comments_delete on comments
  for delete using (auth.uid() = author_id);

create policy comments_admin on comments
  for all using (is_admin()) with check (is_admin());

-- ── stars ──
drop policy if exists post_stars_read   on post_stars;
drop policy if exists post_stars_insert on post_stars;
drop policy if exists post_stars_delete on post_stars;
create policy post_stars_read   on post_stars for select using (true);
create policy post_stars_insert on post_stars for insert with check (auth.uid() = user_id and is_active());
create policy post_stars_delete on post_stars for delete using (auth.uid() = user_id);

drop policy if exists comment_stars_read   on comment_stars;
drop policy if exists comment_stars_insert on comment_stars;
drop policy if exists comment_stars_delete on comment_stars;
create policy comment_stars_read   on comment_stars for select using (true);
create policy comment_stars_insert on comment_stars for insert with check (auth.uid() = user_id and is_active());
create policy comment_stars_delete on comment_stars for delete using (auth.uid() = user_id);

-- ── bookmarks (private) ──
drop policy if exists bookmarks_all on bookmarks;
create policy bookmarks_all on bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── notifications (private; only the system inserts) ──
drop policy if exists notifications_read   on notifications;
drop policy if exists notifications_update on notifications;
drop policy if exists notifications_delete on notifications;
create policy notifications_read   on notifications for select using (auth.uid() = user_id);
create policy notifications_update on notifications for update using (auth.uid() = user_id);
create policy notifications_delete on notifications for delete using (auth.uid() = user_id);

-- ── reports ──
drop policy if exists reports_insert on reports;
drop policy if exists reports_read   on reports;
drop policy if exists reports_admin  on reports;
create policy reports_insert on reports for insert with check (auth.uid() = reporter_id and is_active());
create policy reports_read   on reports for select using (auth.uid() = reporter_id or is_admin());
create policy reports_admin  on reports for all using (is_admin()) with check (is_admin());

-- ── moderation log (admins only) ──
drop policy if exists modlog_admin on moderation_log;
create policy modlog_admin on moderation_log
  for all using (is_admin()) with check (is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
--  FEED VIEW — one query, everything the post card needs
--  This is the whole performance story: the old dashboard issued ~3 queries
--  per post plus one per unique author. This is a single indexed scan.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace view post_feed
with (security_invoker = true)
as
select
  p.id, p.title, p.content, p.rating,
  p.star_count, p.comment_count, p.view_count, p.hot_score,
  p.is_hidden, p.created_at, p.updated_at,
  p.author_id,
  pr.username        as author_username,
  pr.display_name    as author_display_name,
  pr.avatar_url      as author_avatar_url,
  pr.level           as author_level,
  pr.exp             as author_exp,
  pr.role            as author_role,
  pr.is_banned       as author_is_banned,
  g.id               as game_id,
  g.name             as game_name,
  g.slug             as game_slug,
  g.cover_url        as game_cover_url
from posts p
join profiles pr on pr.id = p.author_id
left join games g on g.id = p.game_id
where not pr.is_banned;


-- ═══════════════════════════════════════════════════════════════════════════
--  REALTIME — lets the feed live-update without polling
-- ═══════════════════════════════════════════════════════════════════════════
do $$ begin
  alter publication supabase_realtime add table posts;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table comments;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table notifications;
exception when duplicate_object then null; end $$;


-- ═══════════════════════════════════════════════════════════════════════════
--  STORAGE — avatars bucket
-- ═══════════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars public read"  on storage.objects;
drop policy if exists "avatars owner write"  on storage.objects;
drop policy if exists "avatars owner update" on storage.objects;
drop policy if exists "avatars owner delete" on storage.objects;

create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

-- Files must live under a folder named after the user's uuid: `<uid>/pic.png`
create policy "avatars owner write" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars owner update" on storage.objects
  for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars owner delete" on storage.objects
  for delete using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ═══════════════════════════════════════════════════════════════════════════
do $$ begin
  raise notice '';
  raise notice '  ██ EXPoints v2 schema installed.';
  raise notice '  Tables .... profiles games posts comments post_stars comment_stars';
  raise notice '              bookmarks notifications reports moderation_log';
  raise notice '  View ...... post_feed  (single-query feed)';
  raise notice '  RLS ....... enabled with ownership-scoped policies';
  raise notice '  EXP ....... trigger-driven, level = exp_to_level(exp)';
  raise notice '';
  raise notice '  Next: run seed.sql for the game catalogue, then promote';
  raise notice '  yourself with:  update profiles set role = ''admin'' where username = ''YOU'';';
  raise notice '';
end $$;
