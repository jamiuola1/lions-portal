-- Phase 3: profile auto-creation, audit log, and server-enforced membership approval.

-- One open application per person.
create unique index one_open_application on membership_applications (user_id) where status = 'submitted';

create table audit_logs (
  id bigint primary key generated always as identity,
  actor_id uuid references profiles(id),
  action text not null,
  target_type text not null,
  target_id text not null,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table audit_logs enable row level security;
create policy audit_admin_read on audit_logs for select using (has_role('admin'));
-- No insert/update/delete policies: rows are written only by security-definer functions below.

-- Create a profile for every new auth user (email/password or Google).
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  base text;
  candidate text;
begin
  base := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), '[^a-z0-9_]', '', 'g'));
  if char_length(base) < 3 then base := 'member'; end if;
  base := left(base, 22);
  candidate := base;
  while exists (select 1 from profiles where username = candidate) loop
    candidate := base || '_' || substr(encode(gen_random_bytes(3), 'hex'), 1, 6);
  end loop;
  insert into profiles (id, username, display_name)
  values (new.id, candidate,
          coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), nullif(new.raw_user_meta_data->>'display_name', ''), candidate));
  insert into profile_private (id) values (new.id);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create or replace function approve_application(app_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  app membership_applications%rowtype;
begin
  if not (has_role('admin') or has_role('membership_officer')) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select * into app from membership_applications where id = app_id and status = 'submitted' for update;
  if not found then raise exception 'application not found or already reviewed'; end if;
  update membership_applications set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now() where id = app_id;
  insert into memberships (user_id, status) values (app.user_id, 'active') on conflict (user_id) do nothing;
  insert into audit_logs (actor_id, action, target_type, target_id) values (auth.uid(), 'application.approved', 'membership_application', app_id::text);
end;
$$;

create or replace function reject_application(app_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (has_role('admin') or has_role('membership_officer')) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  update membership_applications set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
    where id = app_id and status = 'submitted';
  if not found then raise exception 'application not found or already reviewed'; end if;
  insert into audit_logs (actor_id, action, target_type, target_id) values (auth.uid(), 'application.rejected', 'membership_application', app_id::text);
end;
$$;

revoke execute on function approve_application(uuid), reject_application(uuid), has_role(text) from public, anon;
grant execute on function approve_application(uuid), reject_application(uuid), has_role(text) to authenticated;
