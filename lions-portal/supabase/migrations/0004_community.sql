-- Phase 4: community feed. Participation needs a confirmed, non-suspended account (not club membership).

create or replace function is_moderator() returns boolean language sql stable security definer set search_path = public as $$
  select has_role('admin') or has_role('moderator');
$$;
create or replace function is_active_user() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and not is_suspended);
$$;

create table discussion_categories (
  id smallint primary key generated always as identity,
  slug text unique not null,
  name text not null,
  sort_order integer not null default 0,
  staff_only boolean not null default false,
  archived boolean not null default false
);
insert into discussion_categories (slug, name, sort_order, staff_only) values
  ('oshawa-news','Oshawa community news',1,false), ('volunteering','Local volunteering',2,false),
  ('charity','Charity and fundraising',3,false), ('events','Community events',4,false),
  ('recommendations','Local recommendations',5,false), ('neighbourhoods','Neighbourhood discussions',6,false),
  ('club-announcements','Club announcements',7,true), ('general','General discussion',8,false);

create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  category_id smallint not null references discussion_categories(id),
  body text not null check (char_length(body) between 1 and 5000),
  status text not null default 'visible' check (status in ('visible','removed')),
  comment_count integer not null default 0,
  reaction_count integer not null default 0,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
create index posts_feed on posts (created_at desc) where status = 'visible';
create index posts_by_category on posts (category_id, created_at desc) where status = 'visible';
create index posts_popular on posts (reaction_count desc, created_at desc) where status = 'visible';

create table post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null,
  original_name text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now()
);
create index post_media_post on post_media (post_id);

create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'visible' check (status in ('visible','removed')),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
create index comments_post on comments (post_id, created_at);

create table reactions (
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create table follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  followee_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id), check (follower_id <> followee_id)
);
create table saved_posts (
  user_id uuid not null references profiles(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('comment','reply','reaction')),
  actor_id uuid references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user on notifications (user_id, created_at desc);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  status text not null default 'open' check (status in ('open','actioned','dismissed')),
  handled_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  check ((post_id is null) <> (comment_id is null))
);
create unique index report_once_post on reports (reporter_id, post_id) where post_id is not null;
create unique index report_once_comment on reports (reporter_id, comment_id) where comment_id is not null;

create table moderation_actions (
  id bigint primary key generated always as identity,
  moderator_id uuid not null references profiles(id),
  action text not null,
  post_id uuid, comment_id uuid, target_user_id uuid,
  note text,
  created_at timestamptz not null default now()
);

-- Counters and notifications are maintained by triggers, never by client writes.
create or replace function bump_counts() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'comments' then
    if tg_op = 'INSERT' then update posts set comment_count = comment_count + 1 where id = new.post_id;
    else update posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id; end if;
  else
    if tg_op = 'INSERT' then update posts set reaction_count = reaction_count + 1 where id = new.post_id;
    else update posts set reaction_count = greatest(reaction_count - 1, 0) where id = old.post_id; end if;
  end if;
  return null;
end; $$;
create trigger comments_count after insert or delete on comments for each row execute function bump_counts();
create trigger reactions_count after insert or delete on reactions for each row execute function bump_counts();

create or replace function notify_on_comment() returns trigger language plpgsql security definer set search_path = public as $$
declare post_author uuid; parent_author uuid;
begin
  select author_id into post_author from posts where id = new.post_id;
  if post_author <> new.author_id then insert into notifications (user_id, kind, actor_id, post_id) values (post_author, 'comment', new.author_id, new.post_id); end if;
  if new.parent_id is not null then
    select author_id into parent_author from comments where id = new.parent_id;
    if parent_author <> new.author_id and parent_author <> post_author then insert into notifications (user_id, kind, actor_id, post_id) values (parent_author, 'reply', new.author_id, new.post_id); end if;
  end if;
  return null;
end; $$;
create trigger comments_notify after insert on comments for each row execute function notify_on_comment();

create or replace function notify_on_reaction() returns trigger language plpgsql security definer set search_path = public as $$
declare post_author uuid;
begin
  select author_id into post_author from posts where id = new.post_id;
  if post_author <> new.user_id then insert into notifications (user_id, kind, actor_id, post_id) values (post_author, 'reaction', new.user_id, new.post_id); end if;
  return null;
end; $$;
create trigger reactions_notify after insert on reactions for each row execute function notify_on_reaction();

-- Row Level Security
alter table discussion_categories enable row level security;
alter table posts enable row level security;
alter table post_media enable row level security;
alter table comments enable row level security;
alter table reactions enable row level security;
alter table follows enable row level security;
alter table saved_posts enable row level security;
alter table notifications enable row level security;
alter table reports enable row level security;
alter table moderation_actions enable row level security;

create policy cats_read on discussion_categories for select to authenticated using (not archived or has_role('admin'));
create policy cats_admin on discussion_categories for all to authenticated using (has_role('admin')) with check (has_role('admin'));

create policy posts_read on posts for select to authenticated using (status = 'visible' or author_id = auth.uid() or is_moderator());
create policy posts_insert on posts for insert to authenticated with check (
  author_id = auth.uid() and is_active_user() and status = 'visible'
  and exists (select 1 from discussion_categories c where c.id = category_id and not c.archived and (not c.staff_only or is_moderator())));
create policy posts_update_own on posts for update to authenticated using (author_id = auth.uid() and is_active_user() and status = 'visible') with check (author_id = auth.uid() and status = 'visible');
create policy posts_delete_own on posts for delete to authenticated using (author_id = auth.uid());
revoke update on posts from authenticated, anon;
grant update (body, edited_at) on posts to authenticated;

create policy media_read on post_media for select to authenticated using (exists (select 1 from posts p where p.id = post_id and (p.status = 'visible' or p.author_id = auth.uid() or is_moderator())));
create policy media_insert on post_media for insert to authenticated with check (exists (select 1 from posts p where p.id = post_id and p.author_id = auth.uid()) and is_active_user());
create policy media_delete_own on post_media for delete to authenticated using (exists (select 1 from posts p where p.id = post_id and p.author_id = auth.uid()));

create policy comments_read on comments for select to authenticated using (status = 'visible' or author_id = auth.uid() or is_moderator());
create policy comments_insert on comments for insert to authenticated with check (
  author_id = auth.uid() and is_active_user() and status = 'visible'
  and exists (select 1 from posts p where p.id = post_id and p.status = 'visible'));
create policy comments_update_own on comments for update to authenticated using (author_id = auth.uid() and is_active_user() and status = 'visible') with check (author_id = auth.uid() and status = 'visible');
create policy comments_delete_own on comments for delete to authenticated using (author_id = auth.uid());
revoke update on comments from authenticated, anon;
grant update (body, edited_at) on comments to authenticated;

create policy reactions_read on reactions for select to authenticated using (true);
create policy reactions_insert on reactions for insert to authenticated with check (user_id = auth.uid() and is_active_user());
create policy reactions_delete on reactions for delete to authenticated using (user_id = auth.uid());

create policy follows_read on follows for select to authenticated using (follower_id = auth.uid() or followee_id = auth.uid());
create policy follows_insert on follows for insert to authenticated with check (follower_id = auth.uid() and is_active_user());
create policy follows_delete on follows for delete to authenticated using (follower_id = auth.uid());

create policy saved_all on saved_posts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy notif_read on notifications for select to authenticated using (user_id = auth.uid());
create policy notif_update on notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on notifications from authenticated, anon;
grant update (read_at) on notifications to authenticated;

create policy reports_insert on reports for insert to authenticated with check (reporter_id = auth.uid() and is_active_user() and status = 'open');
create policy reports_read on reports for select to authenticated using (reporter_id = auth.uid() or is_moderator());
create policy modlog_read on moderation_actions for select to authenticated using (is_moderator());

-- Moderation actions (atomic, authorized inside the function, always logged)
create or replace function remove_content(p_kind text, p_id uuid, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_moderator() then raise exception 'not authorized' using errcode = '42501'; end if;
  if p_kind = 'post' then
    update posts set status = 'removed' where id = p_id;
    update reports set status = 'actioned', handled_by = auth.uid() where post_id = p_id and status = 'open';
    insert into moderation_actions (moderator_id, action, post_id, note) values (auth.uid(), 'post.removed', p_id, p_note);
  elsif p_kind = 'comment' then
    update comments set status = 'removed' where id = p_id;
    update reports set status = 'actioned', handled_by = auth.uid() where comment_id = p_id and status = 'open';
    insert into moderation_actions (moderator_id, action, comment_id, note) values (auth.uid(), 'comment.removed', p_id, p_note);
  else raise exception 'unknown kind'; end if;
end; $$;

create or replace function dismiss_report(p_id uuid, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_moderator() then raise exception 'not authorized' using errcode = '42501'; end if;
  update reports set status = 'dismissed', handled_by = auth.uid() where id = p_id and status = 'open';
  insert into moderation_actions (moderator_id, action, note) values (auth.uid(), 'report.dismissed', p_note);
end; $$;

create or replace function set_suspended(p_user uuid, p_suspended boolean, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_moderator() then raise exception 'not authorized' using errcode = '42501'; end if;
  if exists (select 1 from user_roles ur join roles r on r.id = ur.role_id where ur.user_id = p_user and r.key = 'admin') then
    raise exception 'admins cannot be suspended here';
  end if;
  update profiles set is_suspended = p_suspended where id = p_user;
  insert into moderation_actions (moderator_id, action, target_user_id, note) values (auth.uid(), case when p_suspended then 'user.suspended' else 'user.unsuspended' end, p_user, p_note);
end; $$;

revoke execute on function is_moderator(), is_active_user(), remove_content(text,uuid,text), dismiss_report(uuid,text), set_suspended(uuid,boolean,text) from public, anon;
grant execute on function is_moderator(), is_active_user(), remove_content(text,uuid,text), dismiss_report(uuid,text), set_suspended(uuid,boolean,text) to authenticated;

-- Media bucket: private. Files are served by short-lived signed URLs from server code.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('community-media','community-media', false, 52428800,
   array['image/jpeg','image/png','image/webp','image/gif','application/pdf','video/mp4','video/webm'])
on conflict (id) do nothing;
create policy cm_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'community-media' and (storage.foldername(name))[1] = auth.uid()::text and is_active_user());
create policy cm_read on storage.objects for select to authenticated using (bucket_id = 'community-media');
create policy cm_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'community-media' and ((storage.foldername(name))[1] = auth.uid()::text or is_moderator()));
