-- Fix: 0001 let a user update any column on their own profile, including is_suspended and username.
revoke update on profiles from authenticated, anon;
grant update (display_name, nickname, bio, avatar_path, municipality) on profiles to authenticated;
drop policy profiles_update_own on profiles;
create policy profiles_update_own on profiles for update
  using (auth.uid() = id and not is_suspended) with check (auth.uid() = id and not is_suspended);

-- Rate limiting, fixed windows, atomic. Called only from server code with the service role.
create table rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (key, window_start)
);
alter table rate_limits enable row level security;

create or replace function check_rate_limit(p_key text, p_max integer, p_window_seconds integer) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  bucket timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  c integer;
begin
  insert into rate_limits (key, window_start, count) values (p_key, bucket, 1)
  on conflict (key, window_start) do update set count = rate_limits.count + 1
  returning count into c;
  if random() < 0.01 then delete from rate_limits where window_start < now() - interval '1 day'; end if;
  return c <= p_max;
end;
$$;
revoke execute on function check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function check_rate_limit(text, integer, integer) to service_role;

-- Avatars: public read (they are public profile pictures), write only inside your own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy avatars_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_update_own on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
