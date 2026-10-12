-- TAJO TAP Backend v1
-- Execute once in Supabase SQL Editor on a new/empty TAJO TAP project.
-- Stack: Supabase Auth + PostgreSQL + Vercel Functions.

create extension if not exists pgcrypto;

-- ---------- helpers ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- auth profile ----------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  insert into public.profiles (user_id, full_name, phone)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Backfill profiles if users were created before this migration.
insert into public.profiles (user_id, full_name, phone)
select
  u.id,
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'full_name', '')), ''),
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'phone', '')), '')
from auth.users u
on conflict (user_id) do nothing;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- ---------- authorization ----------
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('super_admin','admin','support')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  contact_name text,
  phone text,
  email text,
  city text,
  state text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists clients_updated_at on public.clients;
create trigger clients_updated_at before update on public.clients
for each row execute function public.set_updated_at();

create table if not exists public.client_members (
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','manager','viewer')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (client_id, user_id)
);

create or replace function public.is_platform_admin(p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.platform_admins a
    where a.user_id = p_user and a.active = true
  );
$$;

create or replace function public.is_client_member(p_client uuid, p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.client_members m
    where m.client_id = p_client and m.user_id = p_user and m.active = true
  );
$$;

-- ---------- plates ----------
create table if not exists public.plates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^TT-[A-Z0-9]{6,12}$'),
  name text not null check (char_length(name) between 2 and 120),
  client_id uuid references public.clients(id) on delete set null,
  status text not null default 'unconfigured' check (status in ('inventory','unconfigured','active','paused','archived')),
  current_destination_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plates_client_id_idx on public.plates(client_id);
create index if not exists plates_status_idx on public.plates(status);

drop trigger if exists plates_updated_at on public.plates;
create trigger plates_updated_at before update on public.plates
for each row execute function public.set_updated_at();

create table if not exists public.plate_destinations (
  id uuid primary key default gen_random_uuid(),
  plate_id uuid not null references public.plates(id) on delete cascade,
  type text not null check (type in ('google','whatsapp','instagram','smart','map','custom')),
  label text not null,
  url text not null check (url ~ '^https://'),
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists plate_destinations_plate_idx on public.plate_destinations(plate_id, created_at desc);

alter table public.plates
  drop constraint if exists plates_current_destination_fk;
alter table public.plates
  add constraint plates_current_destination_fk
  foreign key (current_destination_id)
  references public.plate_destinations(id)
  on delete set null;

create table if not exists public.plate_activation_codes (
  plate_id uuid primary key references public.plates(id) on delete cascade,
  code_hash text not null check (char_length(code_hash) = 64),
  consumed_at timestamptz,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.scan_events (
  id bigint generated by default as identity primary key,
  plate_id uuid not null references public.plates(id) on delete cascade,
  destination_id uuid references public.plate_destinations(id) on delete set null,
  source text not null check (source in ('qr','nfc')),
  device_type text check (device_type is null or device_type in ('mobile','tablet','desktop','unknown')),
  occurred_at timestamptz not null default now()
);

create index if not exists scan_events_plate_time_idx on public.scan_events(plate_id, occurred_at desc);
create index if not exists scan_events_time_idx on public.scan_events(occurred_at desc);

create table if not exists public.audit_logs (
  id bigint generated by default as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_user_id, created_at desc);

-- ---------- atomic destination change ----------
create or replace function public.tajo_set_plate_destination(
  p_plate_id uuid,
  p_type text,
  p_url text,
  p_label text,
  p_actor uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_destination uuid;
begin
  if p_type not in ('google','whatsapp','instagram','smart','map','custom') then
    raise exception 'invalid destination type';
  end if;
  if p_url is null or p_url !~ '^https://' then
    raise exception 'destination must use https';
  end if;
  if not exists (select 1 from public.plates where id = p_plate_id) then
    raise exception 'plate not found';
  end if;

  update public.plate_destinations
  set is_active = false
  where plate_id = p_plate_id and is_active = true;

  insert into public.plate_destinations (plate_id, type, label, url, is_active, created_by)
  values (p_plate_id, p_type, left(coalesce(p_label, 'Destino'), 120), p_url, true, p_actor)
  returning id into v_destination;

  update public.plates
  set current_destination_id = v_destination,
      status = 'active',
      activated_at = coalesce(activated_at, now()),
      updated_at = now()
  where id = p_plate_id;

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (p_actor, 'plate.destination.change', 'plate', p_plate_id,
          jsonb_build_object('destination_id', v_destination, 'type', p_type, 'url', p_url));

  return v_destination;
end;
$$;

-- ---------- admin read models ----------
create or replace view public.plate_admin_view as
select
  p.id,
  p.code,
  p.name,
  p.client_id,
  c.name as client_name,
  p.status,
  p.current_destination_id,
  d.type as destination_type,
  d.label as destination_label,
  d.url as destination_url,
  p.activated_at,
  p.created_at,
  coalesce(s.scans_today, 0)::bigint as scans_today,
  coalesce(s.scans_month, 0)::bigint as scans_month,
  coalesce(s.scans_total, 0)::bigint as scans_total,
  coalesce(s.qr_scans, 0)::bigint as qr_scans,
  coalesce(s.nfc_scans, 0)::bigint as nfc_scans
from public.plates p
left join public.clients c on c.id = p.client_id
left join public.plate_destinations d on d.id = p.current_destination_id
left join (
  select
    plate_id,
    count(*) filter (where occurred_at >= date_trunc('day', now())) as scans_today,
    count(*) filter (where occurred_at >= date_trunc('month', now())) as scans_month,
    count(*) as scans_total,
    count(*) filter (where source = 'qr') as qr_scans,
    count(*) filter (where source = 'nfc') as nfc_scans
  from public.scan_events
  group by plate_id
) s on s.plate_id = p.id;

create or replace view public.client_admin_view as
select
  c.id,
  c.name,
  c.contact_name,
  c.phone,
  c.email,
  c.city,
  c.state,
  c.status,
  c.created_at,
  count(distinct p.id)::bigint as plates_count,
  count(se.id)::bigint as scans_total
from public.clients c
left join public.plates p on p.client_id = c.id
left join public.scan_events se on se.plate_id = p.id
group by c.id;

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.clients enable row level security;
alter table public.client_members enable row level security;
alter table public.plates enable row level security;
alter table public.plate_destinations enable row level security;
alter table public.plate_activation_codes enable row level security;
alter table public.scan_events enable row level security;
alter table public.audit_logs enable row level security;

-- Drop policies so the migration can be safely re-run after edits.
drop policy if exists profiles_self_select on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_select on public.profiles for select to authenticated using (user_id = auth.uid());
create policy profiles_self_update on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists admins_self_select on public.platform_admins;
create policy admins_self_select on public.platform_admins for select to authenticated using (user_id = auth.uid());

drop policy if exists clients_member_select on public.clients;
create policy clients_member_select on public.clients for select to authenticated
using (public.is_platform_admin(auth.uid()) or public.is_client_member(id, auth.uid()));

drop policy if exists client_members_self_select on public.client_members;
create policy client_members_self_select on public.client_members for select to authenticated
using (public.is_platform_admin(auth.uid()) or user_id = auth.uid());

drop policy if exists plates_member_select on public.plates;
create policy plates_member_select on public.plates for select to authenticated
using (public.is_platform_admin(auth.uid()) or (client_id is not null and public.is_client_member(client_id, auth.uid())));

drop policy if exists destinations_member_select on public.plate_destinations;
create policy destinations_member_select on public.plate_destinations for select to authenticated
using (
  public.is_platform_admin(auth.uid()) or exists (
    select 1 from public.plates p
    where p.id = plate_destinations.plate_id
      and p.client_id is not null
      and public.is_client_member(p.client_id, auth.uid())
  )
);

drop policy if exists scans_member_select on public.scan_events;
create policy scans_member_select on public.scan_events for select to authenticated
using (
  public.is_platform_admin(auth.uid()) or exists (
    select 1 from public.plates p
    where p.id = scan_events.plate_id
      and p.client_id is not null
      and public.is_client_member(p.client_id, auth.uid())
  )
);

drop policy if exists audit_admin_select on public.audit_logs;
create policy audit_admin_select on public.audit_logs for select to authenticated
using (public.is_platform_admin(auth.uid()));

-- ---------- grants ----------
revoke all on table public.plate_activation_codes from anon, authenticated;
revoke all on table public.audit_logs from anon;

-- Optional direct authenticated reads remain protected by RLS.
grant select on public.profiles, public.platform_admins, public.clients, public.client_members,
  public.plates, public.plate_destinations, public.scan_events, public.audit_logs to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
revoke execute on function public.is_platform_admin(uuid) from public, anon;
revoke execute on function public.is_client_member(uuid, uuid) from public, anon;
grant execute on function public.is_platform_admin(uuid) to authenticated;
grant execute on function public.is_client_member(uuid, uuid) to authenticated;

-- Server-side secret keys map to service_role. Grants are still required before RLS is considered.
grant all privileges on table public.profiles, public.platform_admins, public.clients, public.client_members,
  public.plates, public.plate_destinations, public.plate_activation_codes, public.scan_events, public.audit_logs to service_role;
grant select on public.plate_admin_view, public.client_admin_view to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on function public.tajo_set_plate_destination(uuid, text, text, text, uuid) to service_role;

-- Do not expose the admin views directly to browser roles.
revoke all on public.plate_admin_view, public.client_admin_view from anon, authenticated;

-- Explicitly revoke the atomic write RPC from browser roles.
revoke execute on function public.tajo_set_plate_destination(uuid, text, text, text, uuid) from public, anon, authenticated;
