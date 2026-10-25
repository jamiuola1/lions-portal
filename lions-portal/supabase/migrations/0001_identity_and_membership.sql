-- Phase 3 foundation: identity, roles, membership. Money is stored in integer cents.
create extension if not exists "pgcrypto";

create type membership_status as enum
  ('applicant','pending_approval','active','renewal_due','past_due','suspended','expired','cancelled');

create table roles (
  id smallint primary key generated always as identity,
  key text unique not null check (key in ('admin','membership_officer','treasurer','content_editor','moderator'))
);
insert into roles (key) values ('admin'),('membership_officer'),('treasurer'),('content_editor'),('moderator');

-- Public-facing fields only. Private data lives in profile_private.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text not null,
  nickname text,
  bio text check (char_length(bio) <= 500),
  avatar_path text,
  municipality text,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now()
);

create table profile_private (
  id uuid primary key references profiles(id) on delete cascade,
  email_visible_to_members boolean not null default false,
  directory_visible boolean not null default false,
  notification_prefs jsonb not null default '{}'
);

create table user_roles (
  user_id uuid not null references profiles(id) on delete cascade,
  role_id smallint not null references roles(id),
  granted_by uuid references profiles(id),
  granted_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table membership_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  interval text not null check (interval in ('month','year')),
  amount_cents integer not null check (amount_cents >= 0),
  currency char(3) not null default 'CAD',
  stripe_price_id text,
  active boolean not null default false  -- off until the club confirms real fees
);

create table membership_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  message text,
  status text not null default 'submitted' check (status in ('submitted','approved','rejected')),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create sequence membership_number_seq start 1001;

create table memberships (
  user_id uuid primary key references profiles(id),
  member_number integer unique not null default nextval('membership_number_seq'),
  status membership_status not null default 'active',
  plan_id uuid references membership_plans(id),
  joined_at date not null default current_date,
  renews_on date,
  stripe_customer_id text unique,
  stripe_subscription_id text unique
);

create or replace function has_role(role_key text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from user_roles ur join roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() and r.key = role_key
  );
$$;

alter table profiles enable row level security;
alter table profile_private enable row level security;
alter table user_roles enable row level security;
alter table membership_plans enable row level security;
alter table membership_applications enable row level security;
alter table memberships enable row level security;

create policy profiles_read on profiles for select using (auth.uid() is not null and not is_suspended);
create policy profiles_update_own on profiles for update using (auth.uid() = id) with check (auth.uid() = id and is_suspended = false);
create policy profiles_insert_own on profiles for insert with check (auth.uid() = id);

create policy private_own on profile_private for all using (auth.uid() = id) with check (auth.uid() = id);

create policy roles_read_own on user_roles for select using (auth.uid() = user_id or has_role('admin'));
create policy roles_admin_write on user_roles for all using (has_role('admin')) with check (has_role('admin'));

create policy plans_read on membership_plans for select using (active or has_role('admin') or has_role('treasurer'));
create policy plans_admin_write on membership_plans for all using (has_role('admin') or has_role('treasurer')) with check (has_role('admin') or has_role('treasurer'));

create policy apps_insert_own on membership_applications for insert with check (auth.uid() = user_id and status = 'submitted');
create policy apps_read on membership_applications for select using (auth.uid() = user_id or has_role('admin') or has_role('membership_officer'));
create policy apps_review on membership_applications for update using (has_role('admin') or has_role('membership_officer'));

create policy memberships_read on memberships for select using (auth.uid() = user_id or has_role('admin') or has_role('membership_officer') or has_role('treasurer'));
-- No client write policy on memberships: status changes come only from server code
-- using the service role (approval action and verified Stripe webhooks).
