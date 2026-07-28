-- ═══════════════════════════════════════════════════════════════════════════
--  FIX: profile counters and EXP were silently reverted on every write
--
--  THE BUG
--  `guard_profile_columns()` is a BEFORE UPDATE trigger on `profiles` that
--  exists to stop a user granting themselves EXP or promoting themselves to
--  admin through the REST API. It allowed the write only when
--  `auth.uid() is null` (service role) or the caller was an admin.
--
--  But the system's own triggers run inside the *user's* transaction, with the
--  user's JWT still set — so auth.uid() is their id, not null. When
--  `on_post_change()` did `update profiles set post_count = post_count + 1`
--  and `award_exp()` did `update profiles set exp = exp + 10`, the guard fired
--  and reverted both to their previous values.
--
--  Net effect: posting, commenting and receiving stars appeared to work, but
--  exp, level, post_count, comment_count and stars_received never moved.
--
--  THE FIX
--  System functions now set a transaction-local flag (`app.system_write`)
--  around their writes. The guard honours that flag and otherwise behaves
--  exactly as before, so the protection against self-granting EXP is intact:
--  a REST call from a user never sets the flag.
--
--  Safe to run on a live database. Idempotent. Ends with a backfill that
--  recomputes every profile's counters from the source tables.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Guard now recognises system writes ──────────────────────────────────
create or replace function guard_profile_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  /*
   * Set by award_exp() and the counter triggers below, transaction-local
   * (set_config's third argument = true), so it cannot leak into another
   * request. A user's REST update never sets it, which is what keeps
   * self-granting EXP impossible.
   */
  if coalesce(current_setting('app.system_write', true), 'off') = 'on' then
    return new;
  end if;

  -- Service-role writes (admin ban/unban/role changes) have a null uid, and
  -- have already been authorised in requireAdmin() on the server.
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


-- ── 2. award_exp flags its write ───────────────────────────────────────────
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


-- ── 3. Counter triggers flag their writes ──────────────────────────────────
create or replace function on_post_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
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

    -- Self-stars count toward the post's visible total but earn nothing.
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

    if author is distinct from old.user_id then
      update profiles set stars_received = greatest(0, stars_received - 1) where id = author;
      perform award_exp(author, 'post_star_received', -1);
    end if;
  end if;

  perform set_config('app.system_write', 'off', true);
  return coalesce(new, old);
end $$;


create or replace function on_comment_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  post_author   uuid;
  post_title    text;
  parent_author uuid;
  actor_name    text;
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


-- ── 4. Backfill: repair everything the bug already dropped ─────────────────
-- Recomputes each profile from the source tables using the same reward values
-- as exp_reward(), so existing accounts get the EXP they should already have.
do $$
declare
  fixed integer;
begin
  perform set_config('app.system_write', 'on', true);

  -- count(*) returns bigint, and exp_to_level() takes integer — Postgres will
  -- not implicitly cast when resolving a function, so every count is cast
  -- explicitly. The EXP total is computed once in `scored` rather than being
  -- repeated for the level calculation.
  with tally as (
    select
      p.id,
      (select count(*) from posts    where author_id = p.id)::integer as posts_made,
      (select count(*) from comments where author_id = p.id)::integer as comments_made,
      (select count(*) from post_stars ps
         join posts po on po.id = ps.post_id
        where po.author_id = p.id and ps.user_id <> p.id)::integer    as post_stars_got,
      (select count(*) from comment_stars cs
         join comments c on c.id = cs.comment_id
        where c.author_id = p.id and cs.user_id <> p.id)::integer     as comment_stars_got
    from profiles p
  ),
  scored as (
    select
      t.*,
      (t.posts_made        * exp_reward('post_created')
     + t.comments_made     * exp_reward('comment_created')
     + t.post_stars_got    * exp_reward('post_star_received')
     + t.comment_stars_got * exp_reward('comment_star_received'))::integer as total_exp
    from tally t
  )
  update profiles pr
     set post_count     = s.posts_made,
         comment_count  = s.comments_made,
         stars_received = s.post_stars_got + s.comment_stars_got,
         exp            = s.total_exp,
         level          = exp_to_level(s.total_exp)
    from scored s
   where pr.id = s.id;

  get diagnostics fixed = row_count;
  perform set_config('app.system_write', 'off', true);

  -- Author levels feed the ranking, so recompute hot scores too.
  perform reindex_hot_scores();

  raise notice '';
  raise notice '  ✔ EXP guard fixed. Recalculated % profile(s).', fixed;
  raise notice '  ✔ Hot scores reindexed.';
  raise notice '';
end $$;
