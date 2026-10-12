-- TAJO TAP V3.3.1 — fluxo de ativação pública única /atv/
-- Execute APÓS 001_tajo_tap_backend.sql (V3.2).
-- Migration incremental e reexecutável. Não apaga plaquinhas/clientes/destinos existentes.
--
-- Correção V3.3.1:
-- PostgreSQL não permite CREATE OR REPLACE FUNCTION alterar o tipo de retorno
-- de uma função já existente. Por isso, as duas RPCs desta migration são
-- explicitamente removidas e recriadas com a assinatura canônica abaixo.

create extension if not exists pgcrypto;

-- ---------- estado de ativação de cada plaquinha ----------
alter table public.tap_plates add column if not exists owner_user_id uuid references auth.users(id) on delete set null;
alter table public.tap_plates add column if not exists setup_status text;
alter table public.tap_plates add column if not exists configuration_locked boolean;
alter table public.tap_plates add column if not exists configured_at timestamptz;
alter table public.tap_plates add column if not exists configured_by uuid references auth.users(id) on delete set null;
alter table public.tap_plates add column if not exists claimed_at timestamptz;

update public.tap_plates
set setup_status = case
  when status = 'active' and current_destination_id is not null then 'completed'
  else 'pending'
end
where setup_status is null;

update public.tap_plates
set configuration_locked = (setup_status = 'completed')
where configuration_locked is null;

alter table public.tap_plates alter column setup_status set default 'pending';
alter table public.tap_plates alter column setup_status set not null;
alter table public.tap_plates alter column configuration_locked set default false;
alter table public.tap_plates alter column configuration_locked set not null;

alter table public.tap_plates drop constraint if exists tap_plates_setup_status_check;
alter table public.tap_plates
  add constraint tap_plates_setup_status_check
  check (setup_status in ('pending','completed'));

create index if not exists tap_plates_owner_user_id_idx on public.tap_plates(owner_user_id);
create index if not exists tap_plates_setup_status_idx on public.tap_plates(setup_status, configuration_locked);

-- ---------- proteção contra tentativa de PIN por força bruta ----------
alter table public.tap_plate_activation_codes add column if not exists failed_attempts integer;
alter table public.tap_plate_activation_codes add column if not exists last_failed_at timestamptz;
alter table public.tap_plate_activation_codes add column if not exists locked_until timestamptz;

update public.tap_plate_activation_codes
set failed_attempts = 0
where failed_attempts is null;

alter table public.tap_plate_activation_codes alter column failed_attempts set default 0;
alter table public.tap_plate_activation_codes alter column failed_attempts set not null;

alter table public.tap_plate_activation_codes drop constraint if exists tap_activation_failed_attempts_check;
alter table public.tap_plate_activation_codes
  add constraint tap_activation_failed_attempts_check
  check (failed_attempts between 0 and 50);

-- ---------- CORREÇÃO DO 42P13 ----------
-- O DROP é proposital: CREATE OR REPLACE não pode mudar OUT parameters/return type.
drop function if exists public.tap_check_activation_pin(text, text);

drop function if exists public.tap_claim_plate_once(
  text, text, uuid, text, text, text, text, text, text, text
);

-- ---------- validação server-only do PIN ----------
create function public.tap_check_activation_pin(
  p_plate_code text,
  p_pin text
)
returns table(result_code text, retry_after integer)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_plate_id uuid;
  v_setup_status text;
  v_configuration_locked boolean;
  v_owner_user_id uuid;
  v_status text;
  v_code_hash text;
  v_consumed_at timestamptz;
  v_expires_at timestamptz;
  v_failed_attempts integer;
  v_locked_until timestamptz;
begin
  select p.id, p.setup_status, p.configuration_locked, p.owner_user_id, p.status
    into v_plate_id, v_setup_status, v_configuration_locked, v_owner_user_id, v_status
  from public.tap_plates p
  where p.code = upper(trim(coalesce(p_plate_code, '')))
  for update;

  if not found then
    return query select 'PLATE_NOT_FOUND'::text, null::integer;
    return;
  end if;

  if v_configuration_locked
     or v_setup_status = 'completed'
     or v_owner_user_id is not null
     or v_status = 'active' then
    return query select 'ALREADY_CONFIGURED'::text, null::integer;
    return;
  end if;

  if v_status not in ('inventory','unconfigured') then
    return query select 'PLATE_UNAVAILABLE'::text, null::integer;
    return;
  end if;

  select a.code_hash, a.consumed_at, a.expires_at, a.failed_attempts, a.locked_until
    into v_code_hash, v_consumed_at, v_expires_at, v_failed_attempts, v_locked_until
  from public.tap_plate_activation_codes a
  where a.plate_id = v_plate_id
  for update;

  if not found then
    return query select 'PIN_NOT_AVAILABLE'::text, null::integer;
    return;
  end if;

  if v_consumed_at is not null then
    return query select 'PIN_USED'::text, null::integer;
    return;
  end if;

  if v_expires_at is not null and v_expires_at <= now() then
    return query select 'PIN_EXPIRED'::text, null::integer;
    return;
  end if;

  if v_locked_until is not null and v_locked_until > now() then
    return query
      select 'PIN_LOCKED'::text,
             greatest(1, ceil(extract(epoch from (v_locked_until - now())))::integer);
    return;
  end if;

  if p_pin is null
     or p_pin !~ '^[0-9]{6}$'
     or encode(digest(p_pin, 'sha256'), 'hex') <> v_code_hash then
    v_failed_attempts := least(coalesce(v_failed_attempts, 0) + 1, 50);
    v_locked_until := case
      when v_failed_attempts >= 5 then now() + interval '15 minutes'
      else null
    end;

    update public.tap_plate_activation_codes
    set failed_attempts = v_failed_attempts,
        last_failed_at = now(),
        locked_until = v_locked_until
    where plate_id = v_plate_id;

    if v_locked_until is not null then
      return query select 'PIN_LOCKED'::text, 900::integer;
    else
      return query select 'PIN_INVALID'::text, null::integer;
    end if;
    return;
  end if;

  update public.tap_plate_activation_codes
  set failed_attempts = 0,
      last_failed_at = null,
      locked_until = null
  where plate_id = v_plate_id;

  return query select 'PIN_OK'::text, null::integer;
end;
$$;

-- ---------- claim atômico + primeiro destino ----------
create function public.tap_claim_plate_once(
  p_plate_code text,
  p_pin text,
  p_user uuid,
  p_company_name text,
  p_contact_name text,
  p_phone text,
  p_email text,
  p_type text,
  p_url text,
  p_label text
)
returns table(
  result_code text,
  plate_id uuid,
  client_id uuid,
  destination_id uuid,
  configured_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_plate public.tap_plates%rowtype;
  v_activation public.tap_plate_activation_codes%rowtype;
  v_client_id uuid;
  v_destination_id uuid;
  v_configured_at timestamptz := now();
  v_attempts integer;
  v_lock_until timestamptz;
begin
  if p_user is null or not exists (select 1 from auth.users u where u.id = p_user) then
    return query select 'USER_NOT_FOUND'::text, null::uuid, null::uuid, null::uuid, null::timestamptz;
    return;
  end if;

  if p_type not in ('google','whatsapp','instagram','smart','map','custom') then
    return query select 'TYPE_INVALID'::text, null::uuid, null::uuid, null::uuid, null::timestamptz;
    return;
  end if;

  if p_url is null or p_url !~ '^https://[^[:space:]]+$' then
    return query select 'URL_INVALID'::text, null::uuid, null::uuid, null::uuid, null::timestamptz;
    return;
  end if;

  select p.* into v_plate
  from public.tap_plates p
  where p.code = upper(trim(coalesce(p_plate_code, '')))
  for update;

  if not found then
    return query select 'PLATE_NOT_FOUND'::text, null::uuid, null::uuid, null::uuid, null::timestamptz;
    return;
  end if;

  if v_plate.configuration_locked
     or v_plate.setup_status = 'completed'
     or v_plate.owner_user_id is not null
     or v_plate.status = 'active' then
    return query
      select 'ALREADY_CONFIGURED'::text,
             v_plate.id,
             v_plate.client_id,
             v_plate.current_destination_id,
             v_plate.configured_at;
    return;
  end if;

  if v_plate.status not in ('inventory','unconfigured') then
    return query select 'PLATE_UNAVAILABLE'::text, v_plate.id, v_plate.client_id, null::uuid, null::timestamptz;
    return;
  end if;

  select a.* into v_activation
  from public.tap_plate_activation_codes a
  where a.plate_id = v_plate.id
  for update;

  if not found then
    return query select 'PIN_NOT_AVAILABLE'::text, v_plate.id, v_plate.client_id, null::uuid, null::timestamptz;
    return;
  end if;

  if v_activation.consumed_at is not null then
    return query select 'PIN_USED'::text, v_plate.id, v_plate.client_id, null::uuid, null::timestamptz;
    return;
  end if;

  if v_activation.expires_at is not null and v_activation.expires_at <= now() then
    return query select 'PIN_EXPIRED'::text, v_plate.id, v_plate.client_id, null::uuid, null::timestamptz;
    return;
  end if;

  if v_activation.locked_until is not null and v_activation.locked_until > now() then
    return query select 'PIN_LOCKED'::text, v_plate.id, v_plate.client_id, null::uuid, null::timestamptz;
    return;
  end if;

  if p_pin is null
     or p_pin !~ '^[0-9]{6}$'
     or encode(digest(p_pin, 'sha256'), 'hex') <> v_activation.code_hash then
    v_attempts := least(coalesce(v_activation.failed_attempts, 0) + 1, 50);
    v_lock_until := case
      when v_attempts >= 5 then now() + interval '15 minutes'
      else null
    end;

    update public.tap_plate_activation_codes
    set failed_attempts = v_attempts,
        last_failed_at = now(),
        locked_until = v_lock_until
    where plate_id = v_plate.id;

    if v_lock_until is not null then
      return query select 'PIN_LOCKED'::text, v_plate.id, v_plate.client_id, null::uuid, null::timestamptz;
    else
      return query select 'PIN_INVALID'::text, v_plate.id, v_plate.client_id, null::uuid, null::timestamptz;
    end if;
    return;
  end if;

  v_client_id := v_plate.client_id;

  if v_client_id is null then
    if p_company_name is null or char_length(trim(p_company_name)) < 2 then
      return query select 'COMPANY_REQUIRED'::text, v_plate.id, null::uuid, null::uuid, null::timestamptz;
      return;
    end if;

    insert into public.tap_clients (name, contact_name, phone, email, status, created_by)
    values (
      left(trim(p_company_name), 120),
      nullif(left(trim(coalesce(p_contact_name, '')), 120), ''),
      nullif(left(trim(coalesce(p_phone, '')), 40), ''),
      nullif(left(lower(trim(coalesce(p_email, ''))), 320), ''),
      'active',
      p_user
    )
    returning id into v_client_id;
  else
    update public.tap_clients c
    set contact_name = coalesce(nullif(c.contact_name, ''), nullif(left(trim(coalesce(p_contact_name, '')), 120), '')),
        phone = coalesce(nullif(c.phone, ''), nullif(left(trim(coalesce(p_phone, '')), 40), '')),
        email = coalesce(nullif(c.email, ''), nullif(left(lower(trim(coalesce(p_email, ''))), 320), '')),
        updated_at = now()
    where c.id = v_client_id;
  end if;

  insert into public.tap_client_members (client_id, user_id, role, active)
  values (v_client_id, p_user, 'owner', true)
  on conflict (client_id, user_id)
  do update set role = 'owner', active = true;

  insert into public.tap_profiles (id, full_name, phone)
  values (
    p_user,
    nullif(left(trim(coalesce(p_contact_name, '')), 120), ''),
    nullif(left(trim(coalesce(p_phone, '')), 40), '')
  )
  on conflict (id) do update
  set full_name = coalesce(nullif(public.tap_profiles.full_name, ''), excluded.full_name),
      phone = coalesce(nullif(public.tap_profiles.phone, ''), excluded.phone),
      updated_at = now();

  update public.tap_plate_destinations
  set is_active = false
  where plate_id = v_plate.id and is_active = true;

  insert into public.tap_plate_destinations (plate_id, type, label, url, is_active, created_by)
  values (
    v_plate.id,
    p_type,
    left(coalesce(nullif(trim(p_label), ''), 'Destino'), 120),
    p_url,
    true,
    p_user
  )
  returning id into v_destination_id;

  update public.tap_plates
  set client_id = v_client_id,
      owner_user_id = p_user,
      setup_status = 'completed',
      configuration_locked = true,
      configured_at = v_configured_at,
      configured_by = p_user,
      claimed_at = v_configured_at,
      current_destination_id = v_destination_id,
      status = 'active',
      activated_at = coalesce(activated_at, v_configured_at),
      updated_at = v_configured_at
  where id = v_plate.id;

  update public.tap_plate_activation_codes
  set consumed_at = v_configured_at,
      failed_attempts = 0,
      last_failed_at = null,
      locked_until = null
  where plate_id = v_plate.id;

  insert into public.tap_audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    p_user,
    'plate.self_activation.complete',
    'plate',
    v_plate.id,
    jsonb_build_object(
      'client_id', v_client_id,
      'destination_id', v_destination_id,
      'type', p_type,
      'source', 'atv'
    )
  );

  return query select 'OK'::text, v_plate.id, v_client_id, v_destination_id, v_configured_at;
end;
$$;

-- ---------- view administrativa ----------
-- Mantém exatamente as colunas antigas na mesma ordem e só adiciona as novas no final.
-- Isso evita erro de CREATE OR REPLACE VIEW por mudança de nome/posição.
create or replace view public.tap_plate_admin_view as
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
  coalesce(s.nfc_scans, 0)::bigint as nfc_scans,
  p.owner_user_id,
  p.setup_status,
  p.configuration_locked,
  p.configured_at,
  p.configured_by,
  p.claimed_at
from public.tap_plates p
left join public.tap_clients c on c.id = p.client_id
left join public.tap_plate_destinations d on d.id = p.current_destination_id
left join (
  select
    plate_id,
    count(*) filter (where occurred_at >= date_trunc('day', now())) as scans_today,
    count(*) filter (where occurred_at >= date_trunc('month', now())) as scans_month,
    count(*) as scans_total,
    count(*) filter (where source = 'qr') as qr_scans,
    count(*) filter (where source = 'nfc') as nfc_scans
  from public.tap_scan_events
  group by plate_id
) s on s.plate_id = p.id;

-- ---------- privilégios ----------
revoke all on function public.tap_check_activation_pin(text, text) from public;
revoke all on function public.tap_check_activation_pin(text, text) from anon;
revoke all on function public.tap_check_activation_pin(text, text) from authenticated;
grant execute on function public.tap_check_activation_pin(text, text) to service_role;

revoke all on function public.tap_claim_plate_once(text, text, uuid, text, text, text, text, text, text, text) from public;
revoke all on function public.tap_claim_plate_once(text, text, uuid, text, text, text, text, text, text, text) from anon;
revoke all on function public.tap_claim_plate_once(text, text, uuid, text, text, text, text, text, text, text) from authenticated;
grant execute on function public.tap_claim_plate_once(text, text, uuid, text, text, text, text, text, text, text) to service_role;

grant select on public.tap_plate_admin_view to service_role;
revoke all on public.tap_plate_admin_view from anon, authenticated;
