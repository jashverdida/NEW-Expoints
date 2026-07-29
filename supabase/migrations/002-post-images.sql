-- ═══════════════════════════════════════════════════════════════════════════
--  FEATURE: image attachments on posts
--
--  Adds an optional image to every review, a storage bucket to hold them, and
--  an admin notification whenever one is uploaded so a human can eyeball it.
--
--  Safe to run on a live database. Idempotent.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Column ──────────────────────────────────────────────────────────────
alter table posts add column if not exists image_url text;

-- Lets the admin panel list image posts without scanning the whole table.
create index if not exists idx_posts_with_image
  on posts (created_at desc)
  where image_url is not null;


-- ── 2. Feed view ───────────────────────────────────────────────────────────
-- CREATE OR REPLACE VIEW cannot add a column, so the view is dropped first.
-- Nothing depends on it besides the app's own queries.
drop view if exists post_feed;

create view post_feed
with (security_invoker = true)
as
select
  p.id, p.title, p.content, p.rating, p.image_url,
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


-- ── 3. Notify admins when an image is attached ─────────────────────────────
/*
 * Fans out one notification per admin. Deliberately a separate trigger rather
 * than folding into on_post_change: image review is a moderation concern, and
 * keeping it isolated means the EXP path stays untouched if this is ever
 * changed or disabled.
 *
 * Fires on INSERT with an image, and on UPDATE when an image is newly added or
 * swapped — editing a post to slip an image in must not bypass review.
 */
create or replace function notify_admins_of_post_image()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  author_name text;
begin
  if new.image_url is null then
    return new;
  end if;

  -- On UPDATE, only fire when the image actually changed.
  if tg_op = 'UPDATE' and old.image_url is not distinct from new.image_url then
    return new;
  end if;

  select username into author_name from profiles where id = new.author_id;

  insert into notifications (user_id, actor_id, type, title, body, link)
  select
    a.id,
    new.author_id,
    'moderation',
    'Image needs review',
    '@' || coalesce(author_name, 'Someone') || ' attached an image to "' ||
      left(new.title, 80) || '"',
    '/post/' || new.id
  from profiles a
  where a.role = 'admin'
    -- Don't notify an admin about their own upload.
    and a.id is distinct from new.author_id;

  return new;
end $$;

drop trigger if exists trg_post_image_review on posts;
create trigger trg_post_image_review
  after insert or update of image_url on posts
  for each row execute function notify_admins_of_post_image();


-- ── 4. Storage bucket ──────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

drop policy if exists "post images public read"  on storage.objects;
drop policy if exists "post images owner write"  on storage.objects;
drop policy if exists "post images owner update" on storage.objects;
drop policy if exists "post images owner delete" on storage.objects;

create policy "post images public read" on storage.objects
  for select using (bucket_id = 'post-images');

-- Files must live under a folder named after the uploader's uuid, so one user
-- can never overwrite another's upload.
create policy "post images owner write" on storage.objects
  for insert with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "post images owner update" on storage.objects
  for update using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can delete anyone's image; everyone else only their own.
create policy "post images owner delete" on storage.objects
  for delete using (
    bucket_id = 'post-images'
    and ((storage.foldername(name))[1] = auth.uid()::text or is_admin())
  );


do $$ begin
  raise notice '';
  raise notice '  ✔ posts.image_url added, post_feed view rebuilt.';
  raise notice '  ✔ post-images bucket created with owner-scoped policies.';
  raise notice '  ✔ Admins are notified whenever an image is attached.';
  raise notice '';
end $$;
